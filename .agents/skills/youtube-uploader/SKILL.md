---
name: youtube-uploader
description: Uploads episode MP4 and thumbnail to the @AIAutomationResearch YouTube channel using OAuth2 and the YouTube Data API v3. Token is saved to .youtube-token.json after first auth. Implemented in upload_youtube.py.
---

# Skill: YouTube Uploader

Handles YouTube upload for the @AIAutomationResearch channel. Implemented in `upload_youtube.py`.

## Auth Method

OAuth2 via `google-auth-oauthlib`. On first run, a browser opens to authorize. Token is saved to `.youtube-token.json` and auto-refreshed on subsequent runs.

**Required files (never commit):**
- `client_secrets.json` — Google Cloud OAuth2 Desktop app credentials
- `.youtube-token.json` — Saved access + refresh token

**Scopes:**
```python
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]
```

## Usage

```bash
# First-time auth (opens browser):
python upload_youtube.py --auth-only

# Full upload:
python upload_youtube.py \
    --video       episodes/aligned-news-2026-05-22-abc123.mp4 \
    --thumbnail   episodes/aligned-news-2026-05-22-abc123-thumbnail.jpg \
    --title       "EngineAI Starts T800 Production | AI Automation Research" \
    --description "Today's AI intelligence briefing..." \
    --tags        "AI news,artificial intelligence,AI automation" \
    --badge       critical \
    --privacy     private
```

## Privacy

Default: `private` — review in YouTube Studio before making public.

```bash
--privacy private    # Default — review before publish
--privacy unlisted   # Shareable link, not public
--privacy public     # Immediately visible
```

## Metadata

- **Category:** 28 (Science & Technology)
- **Language:** English
- **Description:** Assembled from `--description` + badge emoji prefix + chapter timestamps + footer with subscribe CTA
- **Tags:** Comma-separated via `--tags`; defaults include: `AI news, artificial intelligence, AI briefing, AI automation, AI Automation Research, Kevin Tunis, daily AI news`

## Thumbnail Upload

- Max 2MB JPEG
- Small delay (3s) after video upload before thumbnail set (YouTube API requirement)
- Non-fatal if thumbnail fails — video uploads successfully regardless
- Manual fallback: YouTube Studio → Video → Details → Custom thumbnail

## Channel

`@AIAutomationResearch` — Channel ID: `UCGGu0C36KhdKt6TsjsoU0Iw`

## Requirements

```bash
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2
```

## Log

Each upload appended to `heygen-video-log.jsonl`:
```json
{
  "step": "youtube_uploaded",
  "video_id": "...",
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "studio_url": "https://studio.youtube.com/video/.../edit",
  "title": "...",
  "privacy": "private",
  "status": "uploaded"
}
```
