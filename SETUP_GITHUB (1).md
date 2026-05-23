# CLAUDE CODE PROMPT — Read This Project and Push to GitHub
# Save this file as SETUP_GITHUB.md in your Aligned News project root
# Then open Claude Code, navigate to this folder, and say:
# "Read SETUP_GITHUB.md and execute all instructions"

---

You are going to read this entire project directory, understand what's here, and push it to a clean GitHub repository. Follow every step in order. Do not skip steps.

---

## STEP 1 — Read the Project

Scan and read every file in the current directory recursively. For each file you find, note:
- File path
- What it does (one line summary)
- Whether it contains API keys or secrets (flag these — they must NOT be committed)

Print a complete file tree before continuing.

---

## STEP 2 — Check Prerequisites

```bash
gh --version
git --version
python --version
```

If `gh` is not installed:
- Windows: `winget install GitHub.cli`
- Mac: `brew install gh`
Stop and tell me, then wait.

If installed, check auth:
```bash
gh auth status
```

If not authenticated, run:
```bash
gh auth login
```

---

## STEP 3 — Create .gitignore

Based on what you found in Step 1, create a `.gitignore` that excludes:
- Any `.env` files
- Any file containing API keys or secrets you flagged
- `__pycache__/` and `*.pyc`
- `episodes/` folder (large MP4 files)
- `task-run.log`
- `.DS_Store`
- `*.mp4`
- `*.jpg` and `*.png` in thumbnails/ folder
- Any OAuth token files (e.g. `.youtube_token.json`)
- `node_modules/`

Create a safe `.env.example` that lists every environment variable found in the project but with placeholder values instead of real keys.

---

## STEP 4 — Add Skills Layer

Create the following folder and files based on what you actually read in this project. Write each SKILL.md to accurately reflect what the real code does — not generic descriptions.

### .agents/skills/video-pipeline/SKILL.md
Describe the full pipeline orchestration based on the actual entry point file you found. Include real file names, real step names, and real environment variables used.

### .agents/skills/script-writer/SKILL.md
Describe how scripts are actually generated in this project. Reference the real function names, prompt structure, and output file format you found.

### .agents/skills/heygen-renderer/SKILL.md
Describe the actual HeyGen API calls made in this project. Include real endpoint paths, polling logic, and output file locations found in the code.

### .agents/skills/thumbnail-generator/SKILL.md
Describe how thumbnails are actually generated. Reference real libraries, dimensions, and output paths from the code.

### .agents/skills/youtube-uploader/SKILL.md
Describe the actual YouTube upload flow in this project. Include real auth method, privacy settings, and thumbnail attachment approach found in the code.

### .agents/skills/pipeline-logger/SKILL.md
Describe how logging actually works — local log file format, Airtable fields written, and status values used in the real code.

---

## STEP 5 — Create README.md

Write a README.md based on what you actually found in this project. Include:

- What the pipeline does (from the real code)
- Real prerequisites and setup steps
- Real environment variables (from .env.example you created)
- How to run it (real commands from the project)
- File structure (the actual file tree from Step 1)
- Skills table linking to the 6 SKILL.md files
- Installation section:
  ```bash
  npx skills add kevintunis/aligned-news-video-pipeline
  ```
- Community link: https://skool.com/ai-automation-innovators
- Built by Kevin Tunis — kevintunis.com

---

## STEP 6 — Create plugin.json

```json
{
  "name": "aligned-news-video-pipeline",
  "version": "1.0.0",
  "description": "Automated AI video pipeline — Aligned News → HeyGen → YouTube. Built by Kevin Tunis at AI Automation Innovators.",
  "author": "Kevin Tunis",
  "homepage": "https://kevintunis.com",
  "repository": "https://github.com/kevintunis/aligned-news-video-pipeline",
  "community": "https://skool.com/ai-automation-innovators",
  "skills": [
    { "name": "video-pipeline", "path": ".agents/skills/video-pipeline/SKILL.md" },
    { "name": "script-writer", "path": ".agents/skills/script-writer/SKILL.md" },
    { "name": "heygen-renderer", "path": ".agents/skills/heygen-renderer/SKILL.md" },
    { "name": "thumbnail-generator", "path": ".agents/skills/thumbnail-generator/SKILL.md" },
    { "name": "youtube-uploader", "path": ".agents/skills/youtube-uploader/SKILL.md" },
    { "name": "pipeline-logger", "path": ".agents/skills/pipeline-logger/SKILL.md" }
  ]
}
```

---

## STEP 7 — Create INSTALL.md

Write a clean step-by-step install guide for Skool community members. Base it on the real setup process you found in this project. Include:
- Prerequisites checklist
- One-command install
- How to fill in .env
- How to fill in .agents/product-context.md
- How to run a test
- How to schedule with Task Scheduler or cron
- HeyGen credit notes
- Where to get help

---

## STEP 8 — Create .agents/product-context.example.md

```markdown
# My Brand Context

**Host Name:** [Your full name]
**Show Name:** [Your YouTube show name]
**Channel:** [Your YouTube channel name]
**Audience:** [Who watches — e.g., "small business owners exploring AI automation"]
**Tone:** [e.g., "conversational, grounded, practical — no hype"]
**Niche:** [e.g., "AI tools and automation for business owners"]
**HeyGen Avatar ID:** [your_avatar_id from HeyGen studio]
**HeyGen Background ID:** [your_background_id from HeyGen studio]
**Outro CTA:** [e.g., "Subscribe and drop a comment with the tool you want me to cover next."]
```

---

## STEP 9 — Safety Check Before Committing

Before running git add, scan every file that will be committed and confirm:
- No real API keys present anywhere
- No .env file included
- No .youtube_token.json or similar OAuth files included
- No MP4 or large binary files included

If you find any real keys or secrets, remove them and replace with placeholders. Tell me what you found and what you changed.

---

## STEP 10 — Initialize Git and Push to GitHub

```bash
git init
git add .
git commit -m "Initial release: Aligned News Video Pipeline v1.0"
gh repo create kevintunis/aligned-news-video-pipeline \
  --public \
  --description "Automated AI video pipeline — Aligned News → HeyGen → YouTube. Built by Kevin Tunis at AI Automation Innovators." \
  --push \
  --source .
```

---

## STEP 11 — Confirm and Report

Tell me:
1. The live GitHub repo URL
2. Complete list of files committed
3. Any files you excluded and why
4. The exact install command ready to paste into Skool:
   ```
   npx skills add kevintunis/aligned-news-video-pipeline
   ```

That is the complete job. Execute all steps now.
