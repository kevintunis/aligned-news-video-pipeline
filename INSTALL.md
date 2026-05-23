# Install Guide — Aligned News Video Pipeline

Step-by-step setup for AI Automation Innovators community members.

---

## Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
  ```bash
  node --version   # should show v18+
  ```
- [ ] **Python** 3.10 or higher — [python.org](https://www.python.org)
  ```bash
  python --version
  ```
- [ ] **ffmpeg** installed and in PATH — [ffmpeg.org](https://ffmpeg.org/download.html)
  ```bash
  ffmpeg -version
  ```
- [ ] **Aligned News API key** — get at [alignednews.com/account](https://alignednews.com/account)
- [ ] **HeyGen API key** — get at [app.heygen.com/settings](https://app.heygen.com/settings?tab=apiKey)
- [ ] **Anthropic API key** — get at [console.anthropic.com](https://console.anthropic.com)
- [ ] **Google Cloud project** with YouTube Data API v3 enabled + `client_secrets.json`
- [ ] **HeyGen photo avatar** created from a clean studio frame (see `AVATAR-Kevin.md`)

---

## One-Command Install

```bash
npx skills add kevintunis/aligned-news-video-pipeline
```

Or clone manually:

```bash
git clone https://github.com/kevintunis/aligned-news-video-pipeline
cd aligned-news-video-pipeline
npm install
pip install Pillow google-api-python-client google-auth-oauthlib google-auth-httplib2
```

---

## Step 1 — Fill in Your .env

Copy the example and fill in your real keys:

```bash
cp .env.example .env
```

Open `.env` and replace all placeholder values:

```env
ALIGNED_API_KEY=alnw_your_actual_key_here
HEYGEN_API_KEY=your_actual_heygen_key_here
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here
```

**Windows:** Set as User environment variables instead (survives Task Scheduler):

```powershell
[System.Environment]::SetEnvironmentVariable("ALIGNED_API_KEY", "alnw_xxx", "User")
[System.Environment]::SetEnvironmentVariable("HEYGEN_API_KEY", "xxx", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-xxx", "User")
```

---

## Step 2 — Configure Your Avatar

Open `run.mjs` and update the avatar constants at the top:

```javascript
const AVATAR_ID = 'your_photo_avatar_look_id';  // from HeyGen → Avatars → your avatar → look ID
const VOICE_ID  = 'your_voice_clone_id';         // from HeyGen → Voices → your voice → ID
```

To find your IDs:
- **Avatar ID:** HeyGen app → Avatars → click your avatar → copy the Look ID for landscape format
- **Voice ID:** HeyGen app → Voices → click your voice clone → copy the ID

Document your IDs in your own version of `AVATAR-Kevin.md`.

---

## Step 3 — Fill in .agents/product-context.md

Copy the example and customize it for your brand:

```bash
cp .agents/product-context.example.md .agents/product-context.md
```

Fill in all fields — this is how the AI knows your show, audience, and tone.

---

## Step 4 — Set Up YouTube OAuth

### 4a. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g., "My Video Pipeline")
3. Enable **YouTube Data API v3**
4. Go to **APIs & Services → Credentials**
5. Create an **OAuth 2.0 Client ID** — type: **Desktop app**
6. Download the JSON — save as `client_secrets.json` in the project root

### 4b. Add yourself as a test user

1. Go to **APIs & Services → OAuth consent screen**
2. Add your Google account email as a **Test user**

### 4c. Authorize the first time

```bash
python upload_youtube.py --auth-only
```

A browser window opens. Authorize with the Google account that owns your YouTube channel. The token is saved to `.youtube-token.json` and will auto-refresh on subsequent runs.

---

## Step 5 — Run a Test

```bash
# Dry run — prints the script, no HeyGen or YouTube calls
node run.mjs --dry-run
```

If the script looks good:

```bash
# Full pipeline, skipping YouTube (saves HeyGen credits for first test)
node run.mjs --skip-youtube
```

Check `episodes/` for your downloaded MP4.

---

## Step 6 — Schedule with Task Scheduler (Windows)

Open Task Scheduler → Create Basic Task, or use PowerShell:

```powershell
$action  = New-ScheduledTaskAction -Execute "node" -Argument "run.mjs" -WorkingDirectory "C:\path\to\aligned-news-video-pipeline"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday -At 5:30AM
Register-ScheduledTask -TaskName "AlignedNewsProducer" -Action $action -Trigger $trigger -RunLevel Highest
```

Verify it's scheduled:

```powershell
Get-ScheduledTask -TaskName "AlignedNewsProducer"
```

### Schedule with cron (Mac/Linux)

```bash
crontab -e
# Add:
30 5 * * 1-4 cd /path/to/aligned-news-video-pipeline && node run.mjs >> task-run.log 2>&1
```

---

## HeyGen Credit Notes

Each episode render consumes HeyGen credits:

- **Avatar V video generation** is charged per minute of output video
- A 3-minute episode at 1080p typically costs approximately 3 HeyGen credits
- Use `--dry-run` to preview the script without spending credits
- Use `--skip-youtube` to test the full render without uploading

Check your balance at [app.heygen.com/settings](https://app.heygen.com/settings?tab=billing).

---

## Where to Get Help

- **Community:** [skool.com/ai-automation-innovators](https://skool.com/ai-automation-innovators)
- **GitHub Issues:** [github.com/kevintunis/aligned-news-video-pipeline/issues](https://github.com/kevintunis/aligned-news-video-pipeline/issues)
- **Built by Kevin Tunis:** [kevintunis.com](https://kevintunis.com)
- **YouTube:** [@AIAutomationResearch](https://www.youtube.com/@AIAutomationResearch)
