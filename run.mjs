/**
 * run.mjs
 * Full Aligned News pipeline — one command, end to end.
 *
 * Steps:
 *   1. Fetch top signals + stories from Aligned News
 *   2. Generate spoken script via Claude API
 *   3. Submit to HeyGen Avatar V — studio photo avatar (Kevin locked in Texas Hill Country studio)
 *   4. Poll until complete → download MP4 to episodes/
 *   5. Generate thumbnail via make_thumbnail.py
 *   6. Upload to YouTube via upload_youtube.py
 *   7. Log everything to heygen-video-log.jsonl
 *
 * HOW THE STUDIO WORKS:
 *   The AVATAR_ID is a photo avatar created from a clean frame of the confirmed-working
 *   Seedance test video (014bae0d). Kevin appears seated at the live edge desk with the
 *   hat wall, Texas star, Hill Country window, and dual monitors — all baked into the photo.
 *   Avatar V animates Kevin's face/voice while the studio environment remains locked.
 *   No Seedance, no scene generation, no background URL needed — it just works every time.
 *
 * Usage:
 *   ALIGNED_API_KEY=alnw_xxx HEYGEN_API_KEY=xxx ANTHROPIC_API_KEY=sk-ant-xxx node run.mjs
 *   node run.mjs --privacy public
 *   node run.mjs --dry-run
 *
 * Flags:
 *   --dry-run          Print script only, skip HeyGen + YouTube
 *   --skip-youtube     Run HeyGen + thumbnail, skip YouTube upload
 *   --skip-thumbnail   Skip thumbnail generation
 *   --privacy <val>    private | unlisted | public  (default: private)
 *   --python <path>    Python executable (default: python)
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const ALIGNED_API_URL   = process.env.ALIGNED_API_URL   || 'https://alignednews.com';
const ALIGNED_API_KEY   = process.env.ALIGNED_API_KEY   || '';
const HEYGEN_API_KEY    = process.env.HEYGEN_API_KEY    || '';
const HEYGEN_API_URL    = 'https://api.heygen.com';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Kevin AAI Studio — Clean (photo avatar, studio baked in, 1920x1080 landscape, avatar_v + avatar_iv)
// Source: frame extracted at t=1.0s from Seedance test video 014bae0d (Texas Hill Country studio)
const AVATAR_ID = '726be335f74947bcab21b32ed692d093';
const VOICE_ID  = 'a149bfff7f304562aa0d3cfd03c24bf9'; // Kevin custom voice clone

const OUTPUT_DIR = path.join(__dirname, 'episodes');
const LOG_FILE   = path.join(__dirname, 'heygen-video-log.jsonl');

// ── Args ──────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const SKIP_YT    = args.includes('--skip-youtube');
const SKIP_THUMB = args.includes('--skip-thumbnail');
const _privIdx   = args.indexOf('--privacy');
const PRIVACY    = _privIdx !== -1 ? args[_privIdx + 1] : 'private';
const _pyIdx     = args.indexOf('--python');
const PYTHON     = _pyIdx !== -1 ? args[_pyIdx + 1] : 'python';

// ── Validation ────────────────────────────────────────────────────────────────

if (!ALIGNED_API_KEY)   die('ALIGNED_API_KEY is required');
if (!ANTHROPIC_API_KEY) die('ANTHROPIC_API_KEY is required');
if (!HEYGEN_API_KEY && !DRY_RUN) die('HEYGEN_API_KEY is required');

// ── Aligned News ──────────────────────────────────────────────────────────────

async function fetchBrief() {
  log('Fetching Aligned News content...');

  const [signals, stories] = await Promise.all([
    alignedGet('/v1/signals', { limit: 10 }),
    alignedGet('/v1/stories', { limit: 10 }),
  ]);

  const PRIORITY = { critical: 0, bullish: 1, signal: 2, vc: 3, action: 4, interview: 5, caution: 6 };
  const sorted = [...signals].sort((a, b) =>
    (PRIORITY[a.badge] ?? 99) - (PRIORITY[b.badge] ?? 99)
  );

  return { signals: sorted.slice(0, 4), stories: stories.slice(0, 3) };
}

function deriveMeta(brief) {
  const lead  = brief.signals[0] || brief.stories[0];
  const badge = brief.signals[0]?.badge || 'signal';
  const title = `${lead?.title || lead?.headline || "Today's AI Briefing"} | AI Automation Research`;
  const desc  = brief.signals
    .map(s => `• [${(s.badge || '').toUpperCase()}] ${s.title}`)
    .concat(brief.stories.map(s => `• ${s.headline || s.title || ''}`).filter(Boolean))
    .join('\n');
  const tags  = [
    'AI news', 'artificial intelligence', 'AI Automation Research', 'AI briefing',
    ...brief.signals.map(s => s.badge).filter(Boolean),
    ...brief.stories.flatMap(s => (s.tags || []).slice(0, 2)),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);

  return { title, desc, badge, tags };
}

// ── Script generation (Claude) ────────────────────────────────────────────────

async function generateScript(brief) {
  log('Generating script via Claude...');

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const system = `You write spoken scripts for Kevin Tunis, host of the AI Automation Research daily AI briefing.
Kevin is authoritative, warm, and conversational — a seasoned tech journalist who also builds AI workflows.
Write ONLY the spoken words Kevin delivers. No stage directions, scene markers, or formatting symbols.
Target: 420–460 words (approximately 3 minutes at 150 wpm).
Open with a direct, compelling hook tied to the top story. No "Welcome" or "Hello everyone."
Cover the top signals and stories with clarity and context. Be specific — name companies, people, numbers.
End with exactly: "That's your AI Automation Research briefing for ${date}. Stay sharp — I'll see you next time."`;

  const excerpt = (item) => (item?.text || item?.summary || item?.excerpt || '').slice(0, 350);
  const userContent = `Date: ${date}

TOP SIGNALS:
${brief.signals.map(s => `[${(s.badge || 'signal').toUpperCase()}] ${s.title}\n${excerpt(s)}`).join('\n\n')}

STORIES:
${brief.stories.map(s => `${s.headline || s.title || ''}\n${excerpt(s)}`).join('\n\n')}

Write Kevin's 3-minute spoken script.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const script = data.content?.[0]?.text?.trim();
  if (!script) throw new Error('Empty script from Claude');
  return script;
}

// ── HeyGen Avatar V (direct /v3/videos) ──────────────────────────────────────
//
// WHY AVATAR V PHOTO (not Seedance):
//   The AVATAR_ID is a photo avatar created from a clean 1.0s frame of the
//   confirmed-working Seedance test video (014bae0d). Kevin's Texas Hill Country
//   studio is baked directly into the photo — hat wall, Texas star, live edge desk,
//   dual monitors, Hill Country window, Edison bulb lighting.
//
//   Avatar V animates Kevin's face and lip-syncs the voice while the studio
//   environment remains perfectly locked for every episode, regardless of script
//   length. No Seedance multi-scene regression, no background URL needed.

async function submitAvatarV(script, episodeTitle) {
  log('Submitting to HeyGen Avatar V (studio photo avatar)...');

  // IMPORTANT: /v3/videos requires top-level "type": "avatar" as a discriminator.
  // The "engine" field is not accepted in the raw API; engine selection happens
  // automatically (Avatar IV by default). Avatar V features are available via the
  // HeyGen UI / MCP tool but not through the raw endpoint.
  //
  // "caption": { file_format: "srt", style: "default" }
  //   → burns word-level captions into captioned_video_url
  //   → also produces a sidecar SRT at subtitle_url
  const res = await heygenPost('/v3/videos', {
    type:         'avatar',
    avatar_id:    AVATAR_ID,
    script,
    voice_id:     VOICE_ID,
    aspect_ratio: '16:9',
    resolution:   '1080p',
    title:        episodeTitle,
    caption:      { file_format: 'srt', style: 'default' },
  });

  const video_id = res.data?.video_id;
  if (!video_id) throw new Error(`No video_id in response: ${JSON.stringify(res)}`);

  log(`Video ID: ${video_id}`);
  log(`Monitor:  https://app.heygen.com/videos/${video_id}`);
  return video_id;
}

async function pollVideo(videoId) {
  const MAX_MS   = 30 * 60 * 1000;  // 30 min ceiling
  const INTERVAL = 30 * 1000;       // poll every 30s
  const start    = Date.now();

  log('Polling HeyGen (first check in 2min, then every 30s)...');
  await sleep(2 * 60 * 1000);

  while (Date.now() - start < MAX_MS) {
    const res    = await heygenGet(`/v3/videos/${videoId}`);
    const { status, failure_message } = res.data || {};
    const mins   = Math.round((Date.now() - start) / 60000);
    process.stdout.write(`  [${mins}min] ${status}\n`);

    if (status === 'completed') return res.data;
    if (status === 'failed')    throw new Error(`Video failed: ${failure_message || 'unknown error'}`);

    await sleep(INTERVAL);
  }
  throw new Error('Timed out after 30 minutes');
}

async function downloadVideo(videoData) {
  const video_id = videoData.video_id || videoData.id;  // API returns 'id', not 'video_id'
  const { video_url, captioned_video_url, subtitle_url } = videoData;
  const url = captioned_video_url || video_url;
  if (!url) throw new Error('No video URL to download');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const dateStr  = new Date().toISOString().split('T')[0];
  const filename = `aligned-news-${dateStr}-${video_id.slice(0, 8)}.mp4`;
  const outPath  = path.join(OUTPUT_DIR, filename);

  log(`Downloading → ${filename}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  log(`Saved: ${outPath}`);

  return { outPath, video_url, captioned_video_url, subtitle_url };
}

// ── Python scripts ────────────────────────────────────────────────────────────

function makeThumbnail(videoPath, headline, badge) {
  const thumbPath = videoPath.replace(/\.mp4$/, '-thumbnail.jpg');
  log('Generating thumbnail...');
  execFileSync(PYTHON, [
    path.join(__dirname, 'make_thumbnail.py'),
    '--video',    videoPath,
    '--headline', headline,
    '--badge',    badge,
    '--output',   thumbPath,
  ], { stdio: 'inherit' });
  return thumbPath;
}

function uploadYouTube(videoPath, thumbPath, title, description, tags, badge) {
  log('Uploading to YouTube...');
  execFileSync(PYTHON, [
    path.join(__dirname, 'upload_youtube.py'),
    '--video',       videoPath,
    '--thumbnail',   thumbPath,
    '--title',       title,
    '--description', description,
    '--tags',        tags.join(','),
    '--badge',       badge,
    '--privacy',     PRIVACY,
  ], { stdio: 'inherit' });
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function alignedGet(endpoint, params = {}) {
  const url = new URL(`${ALIGNED_API_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ALIGNED_API_KEY}` } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error?.message || `Aligned ${res.status}`); }
  return (await res.json()).data;
}

async function heygenPost(endpoint, body) {
  const res = await fetch(`${HEYGEN_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': `aligned-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HeyGen POST ${endpoint} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function heygenGet(endpoint) {
  const res = await fetch(`${HEYGEN_API_URL}${endpoint}`, { headers: { 'X-Api-Key': HEYGEN_API_KEY } });
  if (!res.ok) throw new Error(`HeyGen GET ${endpoint} ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Logging / utils ───────────────────────────────────────────────────────────

function appendLog(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
}

function log(msg)  { console.log(msg); }
function die(msg)  { console.error(msg); process.exit(1); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function divider(label) {
  const line = '─'.repeat(50);
  console.log(`\n${line}\n  ${label}\n${line}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║      ALIGNED NEWS — FULL PIPELINE        ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`Mode:    ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Privacy: ${PRIVACY}`);
  console.log(`YouTube: ${SKIP_YT ? 'skipped' : 'enabled'}\n`);

  // ── Step 1: Fetch content ─────────────────────────────────────────────────
  divider('STEP 1 — Aligned News');
  const brief = await fetchBrief();
  brief.signals.forEach(s => console.log(`  [${(s.badge || '').toUpperCase().padEnd(8)}] ${s.title}`));
  brief.stories.forEach(s => console.log(`  [STORY   ] ${s.headline || s.title || '(no title)'}`));

  const { title, desc, badge, tags } = deriveMeta(brief);
  console.log(`\nYT Title: ${title}`);
  console.log(`Badge:    ${badge}`);

  // ── Step 2: Generate script ───────────────────────────────────────────────
  divider('STEP 2 — Script (Claude)');
  const script = await generateScript(brief);
  console.log(script.slice(0, 300) + '...');
  console.log(`\n[${script.split(/\s+/).length} words / ~${Math.round(script.split(/\s+/).length / 150)}min]`);

  if (DRY_RUN) {
    console.log('\n--- FULL SCRIPT ---\n');
    console.log(script);
    console.log('\nDry run complete — no HeyGen or YouTube calls made.');
    return;
  }

  // ── Step 3: HeyGen Avatar V ───────────────────────────────────────────────
  divider('STEP 3 — HeyGen Avatar V (Studio)');
  console.log(`Avatar: ${AVATAR_ID}  (Kevin AAI Studio — Clean)`);
  const videoId = await submitAvatarV(script, title);
  appendLog({ step: 'submitted', video_id: videoId, avatar_id: AVATAR_ID, voice_id: VOICE_ID, badge, title, words: script.split(/\s+/).length });

  const videoData = await pollVideo(videoId);
  const { outPath, video_url, captioned_video_url, subtitle_url } = await downloadVideo(videoData);
  appendLog({ step: 'downloaded', video_id: videoData.id || videoId, local_path: outPath, video_url, captioned_video_url, subtitle_url });

  // ── Step 4: Thumbnail ─────────────────────────────────────────────────────
  let thumbPath = null;
  if (!SKIP_THUMB) {
    divider('STEP 4 — Thumbnail');
    const leadTitle = brief.signals[0]?.title || brief.stories[0]?.title || "Today's AI Briefing";
    thumbPath = makeThumbnail(outPath, leadTitle, badge);
  } else {
    divider('STEP 4 — Thumbnail [SKIPPED]');
  }

  // ── Step 5: YouTube upload ────────────────────────────────────────────────
  if (!SKIP_YT) {
    divider('STEP 5 — YouTube Upload');
    if (!thumbPath) console.log('No thumbnail — uploading video only.');
    uploadYouTube(outPath, thumbPath, title, desc, tags, badge);
    appendLog({ step: 'youtube_uploaded', title, privacy: PRIVACY, thumbnail: thumbPath });
  } else {
    divider('STEP 5 — YouTube Upload [SKIPPED]');
    console.log(`Video ready at: ${outPath}`);
    if (thumbPath) console.log(`Thumbnail:      ${thumbPath}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  divider('DONE');
  console.log(`Episode:   ${path.basename(outPath)}`);
  if (thumbPath) console.log(`Thumbnail: ${path.basename(thumbPath)}`);
  if (subtitle_url) console.log(`Subtitles: ${subtitle_url}`);
  console.log(`HeyGen:    https://app.heygen.com/videos/${videoData.id || videoId}`);
  if (!SKIP_YT) console.log(`Privacy set to ${PRIVACY} — change to public in YouTube Studio when ready.`);
}

run().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
