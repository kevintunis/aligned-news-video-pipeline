# AI Automation Research — Pipeline Build Report
**Date:** May 20–21, 2026  
**Channel:** [@AIAutomationResearch](https://www.youtube.com/@AIAutomationResearch)  
**Author:** Kevin Tunis

---

## What We Built

A fully automated daily video production pipeline that runs Monday–Thursday at 5:30 AM, fetches fresh AI news, generates a spoken script, renders Kevin in his locked Texas Hill Country studio, and uploads to YouTube — end to end, no human in the loop.

**One command does everything:**
```powershell
node run.mjs
```

---

## The Pipeline (5 Steps)

```
Aligned News API → Claude Haiku → HeyGen Avatar V → MP4 → Thumbnail → YouTube
```

| Step | What happens | Tool |
|------|-------------|------|
| 1 | Fetch top AI signals + stories | Aligned News API |
| 2 | Generate Kevin's 3-min spoken script | Claude Haiku (`claude-haiku-4-5-20251001`) |
| 3 | Render Kevin in studio, speaking script | HeyGen Avatar V (`/v3/videos`, studio photo avatar) |
| 4 | Generate episode thumbnail | `make_thumbnail.py` |
| 5 | Upload to YouTube as Private for review | `upload_youtube.py` (YouTube Data API v3) |

---

## The Journey: Four Approaches, One Winner

This was the hardest part of the build. We went through four approaches before finding what works.

### Attempt 1 — HeyGen Video Agent with wrong avatar ID
**Problem:** The `avatar_id` was a *video file ID*, not a look ID. The Video Agent generated random avatars (bald men, wrong people) and chose its own backgrounds (datacenters, space). Visually completely wrong.

### Attempt 2 — Direct Avatar V API with orange shirt avatar
**Problem:** The API returned `400: Unable to extract tag using discriminator 'type'` (wrong v2 body format). Fixed the body, but hit a deeper issue: the orange shirt photo avatar (`9362fcaf0c3b41f69dae9e2797b72132`) has Kevin's **living room baked into the photo**. `background` parameter is ignored — Kevin appeared in his living room on every render.

Two background hosting failures also occurred during this attempt:
- **filebin.net** — blocked by HeyGen's rendering servers → `UNKNOWN_ERROR` on every render
- **HeyGen CDN URL** (`resource2.heygen.ai`) — reachable, but still showed living room (photo overrides background)

### Attempt 3 — Video Agent (Seedance) + studio image as `files` attachment ✅ WORKED FOR SHORT SCRIPTS
**Why it worked:** HeyGen's Seedance engine (via `POST /v3/video-agents`) generates Kevin *inside* the scene rather than compositing a photo over a background. Passing the studio image as a `files` attachment gave Seedance the visual reference to reproduce the Texas Hill Country studio.

**Why it failed for production:** For 3-minute scripts, Seedance created 20 scenes and consistently failed to generate Kevin in the studio for scene 1, falling back to his living room. The prompt ("PRODUCTION FORMAT: Single-scene talking head") didn't override Seedance's multi-scene behavior.

### Attempt 4 — Avatar V + Studio-locked photo avatar ✅ FINAL SOLUTION
**The insight:** Instead of fighting Seedance's multi-scene behavior, we baked the studio INTO the avatar. We extracted a clean frame (t=1.0s, no captions) from the confirmed-working Seedance test video (014bae0d) and created a photo avatar from it. Avatar V animates Kevin's face and lip-syncs the voice while the studio environment — hat wall, Texas star, live edge desk, dual monitors, Hill Country window, Edison bulb lighting — remains perfectly locked for every episode, regardless of script length.

**Why this is superior to Seedance:**
- No 20-scene regression for long scripts
- Deterministic: same studio frame every time
- Faster polling interval (30s vs 60s, 2min initial wait vs 3min)
- No CDN URL maintenance required
- No `studio-config.json` or background image uploads needed

---

## Locked Visual Identity

| Asset | Value |
|-------|-------|
| **Avatar** | `726be335f74947bcab21b32ed692d093` — Kevin AAI Studio — Clean (photo_avatar, landscape, 1920×1080) |
| **Voice** | `a149bfff7f304562aa0d3cfd03c24bf9` — Kevin custom voice clone |
| **Studio** | Baked into avatar photo (frame at t=1.0s from Seedance video 014bae0d) |
| **Engine** | HeyGen Avatar V (`/v3/videos`, `engine: {type: "avatar_v"}`) |
| **Orientation** | Landscape 16:9 |
| **Resolution** | 1080p |
| YouTube channel | [@AIAutomationResearch](https://www.youtube.com/@AIAutomationResearch) — Channel ID: UCGGu0C36KhdKt6TsjsoU0Iw |
| Upload privacy | Private (review before publishing) |

### Avatar photo source
Clean JPEG frame extracted via ffmpeg at t=1.0s from the non-captioned video URL of Seedance test video `014bae0d2098487bbd02d4fb02b04c92`. At this timestamp, Kevin's eyes are open, he's facing camera, and no lower-third overlays are present. The frame shows the complete Texas Hill Country studio: western hat collection on barn-wood wall, Texas star accent light, Hill Country oak vista through window, live edge walnut desk, dual monitors with AI dashboards, "BUILD AUTOMATE SCALE" mug, saddle on the left.

Saved as: `C:\Users\kevin\studio-frame-00-00-01_0.jpg`

---

## Files in the Project

| File | Purpose |
|------|---------|
| `run.mjs` | Main pipeline — runs all 5 steps end to end |
| `kevin-studio-frame.jpg` | Canonical source photo — clean frame at t=1.0s from 014bae0d (archive, do not delete) |
| `upload_youtube.py` | YouTube uploader (OAuth2, Brand Account, AI Automation Research) |
| `make_thumbnail.py` | Episode thumbnail generator |
| `AVATAR-Kevin.md` | Avatar look IDs, voice ID, production defaults |
| `studio/STUDIO-SOP.md` | Production SOP with quality checklist |
| `studio/PROMPT-STYLE-GUIDE.md` | Prompt vocabulary for studio consistency |
| `studio/BRAND-FRAMEWORK.md` | "Photo IS the Brand System" framework |
| `heygen-video-log.jsonl` | Append-only log of every video submitted and downloaded |
| `.youtube-token.json` | YouTube OAuth token (authorized for @AIAutomationResearch) |
| `client_secrets.json` | Google Cloud OAuth credentials (Desktop app) |
| `episodes/` | Downloaded MP4 files |
| ~~`studio-config.json`~~ | ~~Cached studio background URL~~ — no longer needed (studio baked in avatar) |

---

## Errors We Solved

| Error | Cause | Fix |
|-------|-------|-----|
| Video Agent generates wrong avatar | `avatar_id` was a video file ID, not a look ID | Verified correct look IDs via HeyGen MCP `list_avatar_looks` |
| HeyGen 400 "discriminator 'type'" | `video_inputs[]` array format is v2 API only | Switched to flat body structure for v3 |
| `workflow internal error` on every render | filebin.net blocked by HeyGen rendering servers | Switched to HeyGen's own CDN URL |
| Kevin in his living room instead of studio | Photo avatar has background baked into the photo | Abandoned direct API; switched to Seedance engine |
| Seedance falls back to living room for long scripts | For 3-min scripts, Seedance generates 20 scenes and fails on studio generation for scene 1 | Abandoned Seedance; switched to Avatar V with studio-baked photo avatar |
| Photo avatar asset upload 400 "asset data must be provided" | `multipart/form-data` with curl/PowerShell was malformed | Upload as raw binary body with `Content-Type: image/jpeg` to `upload.heygen.com/v1/asset` |
| Photo avatar upload 400 "Content type not match binary/octet-stream" | HeyGen CDN URLs (`resource2.heygen.ai`) return `binary/octet-stream` regardless of file type | Upload local file bytes directly instead of providing a URL |
| "FRONTIER LABS" burned into avatar photo | Extracted frame at t=3s from captioned video — lower-third was baked into the frame | Re-extracted at t=1.0s from the non-captioned video URL — clean frame with no overlays |
| `Cannot read properties of undefined (reading 'slice')` | `/v3/videos/{id}` response uses `id` field, not `video_id` | `const video_id = videoData.video_id \|\| videoData.id` |
| YouTube OAuth authorized wrong channel | Browser was signed into personal @kevintunis | Switched to @AIAutomationResearch in Chrome, deleted token, re-authed |
| `UnboundLocalError: cannot access local variable 'google'` | `import google.auth.transport.requests` was inside a function, shadowing the module | Moved to top-level imports |
| BOM in `studio-config.json` | PowerShell 5.1 UTF8 writes add a Byte Order Mark | Used `[System.IO.File]::WriteAllText` with `UTF8Encoding($False)` + `.replace(/^﻿/, '')` in JS |
| YouTube `--title` required error | `argparse` had `required=True` on `--title` | Changed to `required=False, default=""` |
| `UnicodeEncodeError` with ✅ emoji | Windows terminal uses cp1252, not UTF-8 | Replaced `✅` with `[OK]` |
| OAuth 403 access_denied | Google Cloud app in Testing mode, Kevin not added as test user | Added kevintunis@gmail.com to OAuth test users |

---

## How to Run

### Daily production (full pipeline):
```powershell
cd "C:\Users\kevin\Aligned News"
node run.mjs
```

### Test without YouTube upload:
```powershell
node run.mjs --skip-youtube
```

### Dry run (print script only, no HeyGen/YouTube):
```powershell
node run.mjs --dry-run
```

### Upload as public immediately:
```powershell
node run.mjs --privacy public
```

### Verify YouTube auth:
```powershell
python upload_youtube.py --auth-only
```

---

## Scheduled Automation (Windows Task Scheduler)

Runs automatically Monday–Thursday at 5:30 AM. Task name: `AlignedNewsProducer`.

To check or modify:
```powershell
Get-ScheduledTask -TaskName "AlignedNewsProducer"
```

---

## Environment Variables Required

Set permanently in Windows User environment:
```
ALIGNED_API_KEY    — Aligned News API key (alnw_...)
HEYGEN_API_KEY     — HeyGen API key
ANTHROPIC_API_KEY  — Anthropic API key (sk-ant-...)
```

Set with:
```powershell
[System.Environment]::SetEnvironmentVariable("ALIGNED_API_KEY", "alnw_xxx", "User")
```

---

## What "Photo IS the Brand System" Means

The studio is not a green screen composite, not a Seedance prompt, not a background URL — it's a **baked-in photo**. One clean JPEG frame extracted from the confirmed-working Seedance reference video locks Kevin permanently into his Texas Hill Country studio. Avatar V animates the face and voice; everything else stays exactly as it was in that frame.

This is the production model: **one photo + Avatar V = a locked, repeatable studio that costs nothing to maintain and runs unattended four days a week.** No prompt engineering, no CDN URL management, no multi-scene regression risk. The studio just IS the avatar.

### Asset chain (immutable once set)
```
Seedance test video 014bae0d  (the "spot on" reference)
  → ffmpeg frame at t=1.0s   (eyes open, no overlays)
    → HeyGen asset upload     (asset_id: 1f7514c1357346acb8162af4de111a46)
      → Photo avatar training  (look_id: 726be335f74947bcab21b32ed692d093)
        → run.mjs AVATAR_ID   (locked — do not change)
```
