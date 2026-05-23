/**
 * produce.mjs
 * Pulls Aligned News signals + stories → builds scene-by-scene prompt →
 * submits to HeyGen Video Agent with Kevin Tunis avatar → polls completion → downloads MP4.
 *
 * Usage:
 *   ALIGNED_API_KEY=alnw_xxx HEYGEN_API_KEY=xxx node produce.mjs
 *
 * Optional flags:
 *   --dry-run   Print prompt and exit without submitting to HeyGen
 *   --signals   Number of signals to fetch (default: 10)
 *   --stories   Number of stories to fetch (default: 10)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const ALIGNED_API_URL = process.env.ALIGNED_API_URL || 'https://alignednews.com';
const ALIGNED_API_KEY = process.env.ALIGNED_API_KEY || '';
const HEYGEN_API_KEY  = process.env.HEYGEN_API_KEY  || '';
const HEYGEN_API_URL  = 'https://api.heygen.com';

const AVATAR_ID   = '9b21eac2911f4ce8a72401a6803c1679'; // Kevin Tunis — Digital Twin, landscape primary (Avatar V eligible)
const VOICE_ID    = 'a149bfff7f304562aa0d3cfd03c24bf9'; // Kevin voice clone
const GROUP_ID    = '9e2caa59e3984eed9e16c280861f8fd6'; // Kevin avatar group
const ORIENTATION = 'landscape';

const OUTPUT_DIR = path.join(__dirname, 'episodes');
const LOG_FILE   = path.join(__dirname, 'heygen-video-log.jsonl');

const DRY_RUN = process.argv.includes('--dry-run');

// ── Validation ────────────────────────────────────────────────────────────────

if (!ALIGNED_API_KEY) { console.error('ALIGNED_API_KEY is required'); process.exit(1); }
if (!HEYGEN_API_KEY && !DRY_RUN) { console.error('HEYGEN_API_KEY is required'); process.exit(1); }

// ── API helpers ───────────────────────────────────────────────────────────────

async function alignedGet(endpoint, params = {}) {
  const url = new URL(`${ALIGNED_API_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ALIGNED_API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Aligned API error: ${res.status} ${endpoint}`);
  }
  const json = await res.json();
  return json.data;
}

async function heygenPost(endpoint, body) {
  const res = await fetch(`${HEYGEN_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': `aligned-news-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen POST ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function heygenGet(endpoint) {
  const res = await fetch(`${HEYGEN_API_URL}${endpoint}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen GET ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Content fetch ─────────────────────────────────────────────────────────────

async function fetchBrief() {
  console.log('Fetching Aligned News content...');

  const [signals, stories] = await Promise.all([
    alignedGet('/v1/signals', { limit: 10 }),
    alignedGet('/v1/stories', { limit: 10 }),
  ]);

  // Priority order: critical → bullish → signal → others
  const PRIORITY = { critical: 0, bullish: 1, signal: 2, vc: 3, action: 4, interview: 5, caution: 6 };
  const sortedSignals = [...signals].sort((a, b) =>
    (PRIORITY[a.badge] ?? 99) - (PRIORITY[b.badge] ?? 99)
  );

  return {
    signals: sortedSignals.slice(0, 4),
    stories: stories.slice(0, 3),
  };
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt({ signals, stories }) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const dateUpper = date.toUpperCase();

  const lead    = signals[0] || stories[0];
  const sig2    = signals[1];
  const story1  = stories[0];
  const story2  = stories[1];

  const badgeLabel = (badge) => ({
    critical: 'CRITICAL ALERT',
    bullish:  'BULLISH SIGNAL',
    signal:   'AI SIGNAL',
    vc:       'VC WATCH',
    action:   'ACTION ITEM',
    caution:  'CAUTION',
  })[badge] || 'AI SIGNAL';

  const excerpt   = (item) => (item?.text || item?.summary || item?.excerpt || '').slice(0, 400);
  const itemTitle = (item) => item?.title || item?.headline || '';

  const prompt = `The selected presenter delivers a professional AI intelligence briefing for Aligned News dated ${date}. Target duration: 3 minutes. Confident, authoritative, conversational — like a seasoned tech journalist.

SCENE 1 — HOOK (0–8s)
The selected presenter opens directly: "${itemTitle(lead) || 'Breaking AI developments today'}."
Motion graphic: "ALIGNED NEWS | AI INTELLIGENCE BRIEFING | ${dateUpper}" lower-third fly-in.
Tight headshot framing. No padding — cut straight to the story.

SCENE 2 — LEAD SIGNAL (8–75s)
The selected presenter covers the top AI signal: ${itemTitle(signals[0] || story1)}.
${excerpt(signals[0] || story1)}
Motion graphic: ${badgeLabel(signals[0]?.badge)} badge overlay. Key stat or quote as on-screen text.
${signals[0]?.badge === 'critical' ? 'Stock media: urgent, high-stakes AI industry environment.' : 'Stock media: relevant AI lab, datacenter, or tech company environment.'}

SCENE 3 — STORY A (75–135s)
The selected presenter transitions to: ${itemTitle(story1) || itemTitle(sig2)}.
${excerpt(story1) || excerpt(sig2)}
Stock media: real-world footage relevant to the story. Lower-third with source attribution.

${sig2 || story2 ? `SCENE 4 — SIGNAL / STORY B (135–170s)
The selected presenter covers: ${story1 ? itemTitle(sig2) : itemTitle(story2)}.
${story1 ? excerpt(sig2) : excerpt(story2)}
${sig2 ? `Motion graphic: ${badgeLabel(sig2.badge)} badge.` : 'Stock media: B-roll appropriate to topic.'}
Keep this segment tight — 30–40 seconds max.

` : ''}SCENE 5 — SIGN-OFF (170–180s)
The selected presenter closes with: "That's your Aligned News briefing for ${date}. Stay aligned — I'll see you next time."
Outro card: Aligned News branding, subscribe prompt, date stamp motion graphic.

This script is a concept and theme to convey — not verbatim. You have creative freedom to expand, elaborate, and add examples. Do not pad with silence.

STYLE: Professional broadcast news. Motion graphics for signal badges, data overlays, lower-thirds. Stock media for real environments and authentic B-roll. AI-generated visuals for abstract AI concepts only. Clean, modern, authoritative. 16:9 landscape 1080p.`;

  return prompt;
}

// ── HeyGen submit ─────────────────────────────────────────────────────────────

async function submitToHeyGen(prompt) {
  console.log('Submitting to HeyGen Video Agent...');

  const res = await heygenPost('/v3/video-agents', {
    prompt,
    avatar_id: AVATAR_ID,
    voice_id:  VOICE_ID,
    orientation: ORIENTATION,
  });

  const sessionId = res.data?.session_id;
  if (!sessionId) throw new Error(`No session_id in response: ${JSON.stringify(res)}`);

  console.log(`\nSession ID:  ${sessionId}`);
  console.log(`Monitor at:  https://app.heygen.com/video-agent/${sessionId}\n`);

  return sessionId;
}

// ── Poll for completion ───────────────────────────────────────────────────────

async function pollSession(sessionId) {
  const MAX_MS        = 45 * 60 * 1000; // 45 minutes
  const POLL_INTERVAL = 60 * 1000;      // 60 seconds
  const FIRST_WAIT    = 5 * 60 * 1000;  // first check at 5 minutes
  const start = Date.now();

  console.log('Polling for completion (first check in 5min, then every 60s)...');
  await sleep(FIRST_WAIT);

  while (Date.now() - start < MAX_MS) {
    const res = await heygenGet(`/v3/video-agents/${sessionId}`);
    const { status, video_id, progress } = res.data || {};
    const elapsed = Math.round((Date.now() - start) / 60000);

    process.stdout.write(
      `  [${elapsed}min] ${status}${progress != null ? ` ${progress}%` : ''}${video_id ? ` | ${video_id}` : ''}\n`
    );

    if (status === 'completed' && video_id) return { sessionId, ...res.data };
    if (status === 'failed') throw new Error(`Generation failed: ${JSON.stringify(res.data)}`);

    await sleep(POLL_INTERVAL);
  }

  throw new Error('Timed out after 45 minutes. Check HeyGen dashboard for status.');
}

// ── Download video ────────────────────────────────────────────────────────────

async function downloadVideo(videoData) {
  let { video_id, video_url, captioned_video_url } = videoData;

  // Fetch fresh URL if missing (pre-signed URLs can be absent on initial response)
  if (!video_url) {
    const res = await heygenGet(`/v3/videos/${video_id}`);
    video_url = res.data?.video_url;
    captioned_video_url = res.data?.captioned_video_url || captioned_video_url;
  }

  const downloadUrl = captioned_video_url || video_url;
  if (!downloadUrl) throw new Error('No video URL available to download');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const date     = new Date().toISOString().split('T')[0];
  const filename = `aligned-news-${date}-${video_id.slice(0, 8)}.mp4`;
  const outPath  = path.join(OUTPUT_DIR, filename);

  console.log(`\nDownloading → ${filename}`);
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buf = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buf));
  console.log(`Saved: ${outPath}`);

  return { outPath, filename, video_url, captioned_video_url };
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry });
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function produce() {
  console.log('=== Aligned News Producer ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no HeyGen submission)' : 'LIVE'}\n`);

  // 1. Fetch content
  const brief = await fetchBrief();
  console.log(`  Signals: ${brief.signals.length} | Stories: ${brief.stories.length}`);
  brief.signals.forEach(s => console.log(`    [${(s.badge || '').toUpperCase()}] ${s.title}`));
  brief.stories.forEach(s => console.log(`    [STORY] ${s.title}`));
  console.log();

  // 2. Build prompt
  const prompt = buildPrompt(brief);

  if (DRY_RUN) {
    console.log('--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    console.log(`\nPrompt length: ${prompt.length} chars`);
    return;
  }

  // 3. Submit to HeyGen
  const sessionId = await submitToHeyGen(prompt);
  log({
    session_id: sessionId,
    status: 'submitted',
    avatar_id: AVATAR_ID,
    voice_id: VOICE_ID,
    orientation: ORIENTATION,
    prompt_length: prompt.length,
    signals_used: brief.signals.map(s => ({ badge: s.badge, title: s.title })),
    stories_used: brief.stories.map(s => s.headline || s.title),
  });

  // 4. Poll for completion
  const videoData = await pollSession(sessionId);

  // 5. Download
  const { outPath, filename, video_url, captioned_video_url } = await downloadVideo(videoData);

  // 6. Log completion
  log({
    session_id: sessionId,
    video_id: videoData.video_id,
    status: 'completed',
    video_url,
    captioned_video_url,
    subtitle_url: videoData.subtitle_url,
    local_path: outPath,
    heygen_dashboard: `https://app.heygen.com/videos/${videoData.video_id}`,
  });

  // 7. Summary
  console.log('\n=== Episode Ready ===');
  console.log(`File:      ${outPath}`);
  console.log(`Dashboard: https://app.heygen.com/videos/${videoData.video_id}`);
  console.log(`Session:   https://app.heygen.com/video-agent/${sessionId}`);
  if (videoData.subtitle_url) {
    console.log(`Subtitles: ${videoData.subtitle_url}`);
  }
}

produce().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
