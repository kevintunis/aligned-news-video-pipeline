---
name: script-writer
description: Generates Kevin Tunis's spoken AI briefing script using Claude Haiku (claude-haiku-4-5-20251001). Takes Aligned News signals and stories as input; outputs 420–460 word broadcast-ready spoken text.
---

# Skill: Script Writer

Generates Kevin's daily 3-minute spoken script from Aligned News content. Implemented in `generateScript()` in `run.mjs`.

## Model

- **Model:** `claude-haiku-4-5-20251001`
- **API endpoint:** `POST https://api.anthropic.com/v1/messages`
- **Auth header:** `x-api-key: $ANTHROPIC_API_KEY`
- **Max tokens:** 1024

## System Prompt

Kevin Tunis is framed as an authoritative, warm, conversational AI journalist who also builds workflows. Constraints:
- Write ONLY spoken words — no stage directions, scene markers, or formatting symbols
- Target: **420–460 words** (~3 minutes at 150 wpm)
- Open with a direct, compelling hook tied to the top story — no "Welcome" or "Hello everyone"
- Be specific: name companies, people, numbers
- End with: `"That's your AI Automation Research briefing for {date}. Stay sharp — I'll see you next time."`

## User Content Structure

```
Date: {long date string}

TOP SIGNALS:
[BADGE] Signal Title
First 350 chars of signal text/summary/excerpt

STORIES:
Story Headline or Title
First 350 chars of story text/summary/excerpt
```

## Input Data

Signals and stories come from `fetchBrief()`:
- Top 4 signals sorted by badge priority: critical (0) → bullish (1) → signal (2) → vc (3) → action (4) → interview (5) → caution (6)
- Top 3 stories (unranked)

## Output

Raw spoken script text — no markdown, no symbols. Returned from `data.content[0].text.trim()`.

Word count is logged: `script.split(/\s+/).length` words / `~N minutes`.

## Function Location

`generateScript(brief)` in `run.mjs` — called after `fetchBrief()`, before `submitAvatarV()`.
