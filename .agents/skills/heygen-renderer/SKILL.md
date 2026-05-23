---
name: heygen-renderer
description: Submits scripts to HeyGen Avatar V via POST /v3/videos using Kevin's studio-baked photo avatar, polls until complete, and downloads the captioned MP4. Implemented in run.mjs.
---

# Skill: HeyGen Renderer

Handles the HeyGen Avatar V rendering pipeline. Implemented in `submitAvatarV()`, `pollVideo()`, and `downloadVideo()` in `run.mjs`.

## Avatar V API Call

**Endpoint:** `POST https://api.heygen.com/v3/videos`

**Headers:**
```
X-Api-Key: $HEYGEN_API_KEY
Content-Type: application/json
Idempotency-Key: aligned-{timestamp}
```

**Request body:**
```json
{
  "type": "avatar",
  "avatar_id": "726be335f74947bcab21b32ed692d093",
  "script": "<spoken text from Claude>",
  "voice_id": "a149bfff7f304562aa0d3cfd03c24bf9",
  "aspect_ratio": "16:9",
  "resolution": "1080p",
  "title": "<episode title>",
  "caption": { "file_format": "srt", "style": "default" }
}
```

The `type: "avatar"` discriminator is required for the v3 endpoint. The `engine` field is not accepted in the raw API body.

**Response:** `{ data: { video_id: "..." } }`

## Why This Avatar

Avatar ID `726be335f74947bcab21b32ed692d093` is a photo avatar created from a clean frame at t=1.0s of Seedance test video `014bae0d`. Kevin's full Texas Hill Country studio is baked into the photo — hat wall, Texas star, Hill Country window, live edge walnut desk, dual monitors, Edison bulb lighting. Avatar V animates Kevin's face and lip-syncs the voice while the studio stays locked.

**Do NOT:**
- Pass a `background` parameter — it overrides the baked-in studio
- Use the orange shirt avatar (`9362fcaf`) — it has Kevin's living room baked in
- Use the Digital Twin (`9b21eac2`) for the daily pipeline — it doesn't lock the studio

## Polling Logic

```javascript
await sleep(2 * 60 * 1000);           // Wait 2 min before first check
// Then poll GET /v3/videos/{videoId} every 30s, up to 30 min ceiling

// Response fields checked:
{ status, failure_message }  // from res.data

// Terminal states:
// status === 'completed' → proceed to download
// status === 'failed'    → throw error with failure_message
```

## Download

Prefers `captioned_video_url` over `video_url` (burns word-level captions into the video).

**Note:** The API response uses `id` (not `video_id`) — handled with: `videoData.video_id || videoData.id`

**Output path:** `episodes/aligned-news-{YYYY-MM-DD}-{id.slice(0,8)}.mp4`

## Caption / Subtitle

Setting `caption: { file_format: "srt", style: "default" }` produces:
- Captioned video at `captioned_video_url` (word-level captions burned in)
- Sidecar SRT file at `subtitle_url`

## Monitor URL

After submission: `https://app.heygen.com/videos/{video_id}`
