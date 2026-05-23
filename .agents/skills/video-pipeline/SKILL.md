---
name: video-pipeline
description: Full end-to-end Aligned News video production pipeline — fetch AI news, generate script, render HeyGen avatar, create thumbnail, upload to YouTube. Entry point is run.mjs.
---

# Skill: Video Pipeline

Orchestrates the complete Aligned News episode pipeline from one command. Entry point: `run.mjs`.

## Pipeline Steps

```
Aligned News API → Claude Haiku → HeyGen Avatar V → MP4 → make_thumbnail.py → upload_youtube.py
```

| Step | Action | File/Tool |
|------|--------|-----------|
| 1 | Fetch top 4 signals + 3 stories from Aligned News API | `alignedGet('/v1/signals')`, `alignedGet('/v1/stories')` |
| 2 | Sort signals by badge priority (critical → bullish → signal → vc → action → caution) | `fetchBrief()` in `run.mjs` |
| 3 | Generate Kevin's 3-min spoken script via Claude Haiku | `generateScript()` in `run.mjs` |
| 4 | Submit to HeyGen Avatar V (`POST /v3/videos`) | `submitAvatarV()` in `run.mjs` |
| 5 | Poll HeyGen every 30s (first check after 2min, 30min ceiling) | `pollVideo()` in `run.mjs` |
| 6 | Download captioned MP4 to `episodes/aligned-news-YYYY-MM-DD-{video_id_8}.mp4` | `downloadVideo()` in `run.mjs` |
| 7 | Generate thumbnail (1280×720 JPEG) | `make_thumbnail.py` via `execFileSync` |
| 8 | Upload to YouTube as private | `upload_youtube.py` via `execFileSync` |
| 9 | Append JSONL log entry for each step | `appendLog()` → `heygen-video-log.jsonl` |

## Usage

```powershell
# Set env vars permanently (Windows)
[System.Environment]::SetEnvironmentVariable("ALIGNED_API_KEY", "alnw_xxx", "User")
[System.Environment]::SetEnvironmentVariable("HEYGEN_API_KEY", "xxx", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-xxx", "User")

# Run full pipeline
node run.mjs

# Flags
node run.mjs --dry-run          # Print script only, skip HeyGen + YouTube
node run.mjs --skip-youtube     # Run HeyGen + thumbnail, skip upload
node run.mjs --skip-thumbnail   # Skip thumbnail generation
node run.mjs --privacy public   # Set YouTube privacy (private | unlisted | public)
node run.mjs --python python3   # Override Python executable path
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `ALIGNED_API_KEY` | Aligned News API key (`alnw_...`) |
| `HEYGEN_API_KEY` | HeyGen API key |
| `ANTHROPIC_API_KEY` | Anthropic API key (`sk-ant-...`) |

## Avatar Configuration (Locked)

```javascript
AVATAR_ID = '726be335f74947bcab21b32ed692d093'  // Kevin AAI Studio — Clean (photo_avatar, studio baked in)
VOICE_ID  = 'a149bfff7f304562aa0d3cfd03c24bf9'  // Kevin custom voice clone
```

The studio (Texas Hill Country — hat wall, Texas star, live edge desk, dual monitors) is baked directly into the avatar photo. No background URL is needed. Do not pass a `background` parameter — it will override the baked-in studio.

## Output

- **Video:** `episodes/aligned-news-YYYY-MM-DD-{8-char-id}.mp4`
- **Thumbnail:** `episodes/aligned-news-YYYY-MM-DD-{8-char-id}-thumbnail.jpg`
- **Log:** `heygen-video-log.jsonl` (append-only JSONL)

## Scheduled Automation

Runs Mon–Thu at 5:30 AM via Windows Task Scheduler (task name: `AlignedNewsProducer`).

```powershell
Get-ScheduledTask -TaskName "AlignedNewsProducer"
```
