---
name: pipeline-logger
description: Append-only JSONL logger for all pipeline events. Each step writes one line to heygen-video-log.jsonl. No database, no remote calls — pure local file logging.
---

# Skill: Pipeline Logger

Append-only JSONL logging for all pipeline steps. Implemented via `appendLog()` in `run.mjs` and `log_upload()` in `upload_youtube.py`.

## Log File

**Path:** `heygen-video-log.jsonl` (project root)

**Format:** One JSON object per line, each with a `timestamp` (ISO 8601 UTC) and a `step` field.

## Log Entries

### Step: `submitted`
Written immediately after `POST /v3/videos` succeeds:
```json
{
  "timestamp": "2026-05-22T11:56:13.751Z",
  "step": "submitted",
  "video_id": "cc73de7f58094d4082f5bbae2908841a",
  "avatar_id": "726be335f74947bcab21b32ed692d093",
  "voice_id": "a149bfff7f304562aa0d3cfd03c24bf9",
  "badge": "critical",
  "title": "EngineAI Starts 10,000-Unit T800 Humanoid Production Line | AI Automation Research",
  "words": 386
}
```

### Step: `downloaded`
Written after the MP4 is saved locally:
```json
{
  "timestamp": "2026-05-22T12:05:22.430Z",
  "step": "downloaded",
  "video_id": "cc73de7f58094d4082f5bbae2908841a",
  "local_path": "C:\\Users\\kevin\\Aligned News\\episodes\\aligned-news-2026-05-22-cc73de7f.mp4",
  "video_url": "https://files2.heygen.ai/...",
  "captioned_video_url": "https://files2.heygen.ai/...",
  "subtitle_url": "https://files2.heygen.ai/..."
}
```

### Step: `youtube_uploaded`
Written after a successful YouTube upload:
```json
{
  "timestamp": "2026-05-22T12:30:00.000Z",
  "step": "youtube_uploaded",
  "video_id": "ytVideoId123",
  "youtube_url": "https://www.youtube.com/watch?v=ytVideoId123",
  "studio_url": "https://studio.youtube.com/video/ytVideoId123/edit",
  "title": "...",
  "privacy": "private",
  "local_video": "...",
  "local_thumbnail": "...",
  "status": "uploaded"
}
```

## Implementation

```javascript
// run.mjs
function appendLog(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
}

// LOG_FILE = path.join(__dirname, 'heygen-video-log.jsonl')
```

```python
# upload_youtube.py
def log_upload(entry: dict):
    log_path = Path(__file__).parent / "heygen-video-log.jsonl"
    line = json.dumps({"timestamp": datetime.datetime.utcnow().isoformat(), **entry})
    with open(log_path, "a") as f:
        f.write(line + "\n")
```

## Status Values

| `step` | Written by | When |
|--------|-----------|------|
| `submitted` | `run.mjs` | After HeyGen video ID received |
| `downloaded` | `run.mjs` | After MP4 saved to `episodes/` |
| `youtube_uploaded` | `upload_youtube.py` | After YouTube upload confirmed |

## Notes

- Append-only — never overwrite or truncate
- No Airtable or remote logging — local file only
- HeyGen signed CDN URLs in `video_url` / `captioned_video_url` expire after ~24h (for reference only)
- `heygen-video-log.jsonl` is safe to commit — it contains no API keys
