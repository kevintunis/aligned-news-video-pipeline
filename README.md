# Aligned News Video Pipeline

A fully automated daily AI video production pipeline. One command fetches today's top AI signals from Aligned News, generates Kevin's spoken script via Claude, renders the episode with HeyGen Avatar V (studio-locked photo avatar), generates a thumbnail, and uploads to YouTube — end to end, no human required.

**Channel:** [@AIAutomationResearch](https://www.youtube.com/@AIAutomationResearch)  
**Built by:** [Kevin Tunis](https://kevintunis.com) — [AI Automation Innovators](https://skool.com/ai-automation-innovators)

---

## What It Does

```
Aligned News API → Claude Haiku → HeyGen Avatar V → MP4 → Thumbnail → YouTube
```

| Step | Tool | Output |
|------|------|--------|
| Fetch top AI signals + stories | Aligned News API | Ranked briefing data |
| Generate Kevin's 3-min spoken script | Claude Haiku (`claude-haiku-4-5-20251001`) | 420–460 word spoken script |
| Render Kevin in Texas Hill Country studio | HeyGen Avatar V (`/v3/videos`) | 1080p MP4 with burned-in captions |
| Generate episode thumbnail | `make_thumbnail.py` (Pillow + ffmpeg) | 1280×720 JPEG |
| Upload to YouTube | `upload_youtube.py` (YouTube Data API v3) | Private video ready for review |
| Log everything | `heygen-video-log.jsonl` | Append-only JSONL audit trail |

---

## The Studio

Kevin's Texas Hill Country studio — hat wall, Texas star, Hill Country window, live edge walnut desk, dual monitors, Edison bulb lighting — is **baked into the avatar photo**. Avatar V animates Kevin's face and lip-syncs the voice while the studio stays locked for every episode.

This is the "photo IS the brand system" model: one clean JPEG frame extracted from a confirmed-working video becomes a virtual standing set that runs unattended, costs nothing to maintain, and produces a consistent visual identity across every episode.

See `studio/BRAND-FRAMEWORK.md` for the full framework.

---

## Prerequisites

- **Node.js** v18+ (`node --version`)
- **Python** 3.10+ (`python --version`)
- **ffmpeg** in PATH (`ffmpeg -version`)
- **Python packages:** `pip install Pillow google-api-python-client google-auth-oauthlib google-auth-httplib2`
- **API keys:** Aligned News, HeyGen, Anthropic
- **Google Cloud:** YouTube Data API v3 enabled, `client_secrets.json` (Desktop app OAuth2) in project root

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kevintunis/aligned-news-video-pipeline
cd aligned-news-video-pipeline
npm install
```

### 2. Set environment variables

```powershell
# Windows — set permanently for your user
[System.Environment]::SetEnvironmentVariable("ALIGNED_API_KEY", "alnw_your_key", "User")
[System.Environment]::SetEnvironmentVariable("HEYGEN_API_KEY", "your_heygen_key", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-your_key", "User")
```

```bash
# Mac/Linux
export ALIGNED_API_KEY=alnw_your_key
export HEYGEN_API_KEY=your_heygen_key
export ANTHROPIC_API_KEY=sk-ant-your_key
```

### 3. Set up YouTube OAuth

1. Create a Google Cloud project and enable YouTube Data API v3
2. Create an OAuth2 client ID (Desktop app type)
3. Download `client_secrets.json` to the project root
4. Run first-time auth (opens browser):
   ```bash
   python upload_youtube.py --auth-only
   ```

### 4. Configure your avatar

Edit the constants at the top of `run.mjs`:
```javascript
const AVATAR_ID = 'your_photo_avatar_look_id';  // from HeyGen
const VOICE_ID  = 'your_voice_clone_id';         // from HeyGen
```

Or copy `AVATAR-Kevin.md` as a reference for documenting your own avatar IDs.

---

## Environment Variables

See `.env.example` for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `ALIGNED_API_KEY` | Yes | Aligned News API key — get at alignednews.com/account |
| `HEYGEN_API_KEY` | Yes | HeyGen API key — get at app.heygen.com/settings |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — get at console.anthropic.com |
| `ALIGNED_API_URL` | No | Override API base URL (default: https://alignednews.com) |

---

## How to Run

```powershell
# Full pipeline (recommended first run)
node run.mjs

# Dry run — print script only, no HeyGen or YouTube
node run.mjs --dry-run

# Skip YouTube upload
node run.mjs --skip-youtube

# Skip thumbnail
node run.mjs --skip-thumbnail

# Upload as public immediately
node run.mjs --privacy public

# Verify YouTube auth
python upload_youtube.py --auth-only
```

---

## File Structure

```
aligned-news-video-pipeline/
├── .agents/
│   └── skills/
│       ├── video-pipeline/SKILL.md       # Full pipeline orchestration
│       ├── script-writer/SKILL.md        # Claude script generation
│       ├── heygen-renderer/SKILL.md      # HeyGen Avatar V rendering
│       ├── thumbnail-generator/SKILL.md  # Pillow + ffmpeg thumbnail
│       ├── youtube-uploader/SKILL.md     # OAuth2 YouTube upload
│       └── pipeline-logger/SKILL.md      # JSONL logging
├── episodes/                             # Downloaded MP4s (gitignored)
├── motion-graphics-extracted/
│   ├── Aligned News Broadcast.html       # Motion graphics HTML
│   ├── animations.jsx                    # React animation components
│   └── scenes.jsx                        # React scene definitions
├── studio/
│   ├── BRAND-FRAMEWORK.md               # "The Prompt IS the Brand System"
│   ├── PROMPT-STYLE-GUIDE.md            # Prompt vocabulary guide
│   └── STUDIO-SOP.md                    # Repeatable production SOP
├── .env.example                          # Environment variable template
├── .gitignore
├── aligned-news-mcp.ts                   # MCP server for Claude integration
├── AVATAR-Kevin.md                       # Kevin's avatar IDs and production defaults
├── bun.lock
├── heygen-video-log.jsonl               # Append-only production log
├── make_thumbnail.py                     # Thumbnail generator
├── package.json
├── PIPELINE-BUILD-REPORT.md            # Full build journey and architecture
├── plugin.json                          # Skills plugin manifest
├── produce.mjs                          # Legacy HeyGen Video Agent producer
├── render.mjs                           # Motion graphics renderer (Puppeteer + FFmpeg)
├── run.mjs                              # MAIN PIPELINE ENTRY POINT
├── studio-config.json                   # Deprecated: HeyGen background CDN URL
└── upload_youtube.py                    # YouTube uploader
```

---

## Skills

| Skill | Description |
|-------|-------------|
| [video-pipeline](.agents/skills/video-pipeline/SKILL.md) | Full pipeline orchestration via `run.mjs` |
| [script-writer](.agents/skills/script-writer/SKILL.md) | Claude Haiku script generation |
| [heygen-renderer](.agents/skills/heygen-renderer/SKILL.md) | HeyGen Avatar V submission, polling, download |
| [thumbnail-generator](.agents/skills/thumbnail-generator/SKILL.md) | Pillow + ffmpeg thumbnail compositor |
| [youtube-uploader](.agents/skills/youtube-uploader/SKILL.md) | OAuth2 YouTube Data API upload |
| [pipeline-logger](.agents/skills/pipeline-logger/SKILL.md) | Append-only JSONL logging |

---

## Installation (for community members)

```bash
npx skills add kevintunis/aligned-news-video-pipeline
```

---

## Scheduled Automation

On Windows, the pipeline runs Mon–Thu at 5:30 AM via Task Scheduler:

```powershell
Get-ScheduledTask -TaskName "AlignedNewsProducer"
```

See `INSTALL.md` for setup instructions.

---

## Community

[AI Automation Innovators on Skool](https://skool.com/ai-automation-innovators) — Join the community where Kevin teaches AI automation workflows.

---

## Built By

**Kevin Tunis** — [kevintunis.com](https://kevintunis.com)  
YouTube: [@AIAutomationResearch](https://www.youtube.com/@AIAutomationResearch)  
Community: [skool.com/ai-automation-innovators](https://skool.com/ai-automation-innovators)
