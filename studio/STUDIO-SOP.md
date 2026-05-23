# AAI Studio — Repeatable Production SOP

## Locked Master Assets

These files are versioned production assets. Never regenerate. Never crop. Never substitute.

| Asset | File | Purpose |
|---|---|---|
| Studio Background | `AAI_Master_Studio_Background_01.png` | Spatial anchor for all Avatar V generations |
| Avatar Group | `9e2caa59e3984eed9e16c280861f8fd6` | Kevin Tunis digital twin group |
| Primary Look | `landscape=9b21eac2911f4ce8a72401a6803c1679` | Desktop/YouTube format |
| Portrait Look | `portrait=882fcf422d944b4a972495c3475607dd` | Shorts format |
| Voice Clone | `a149bfff7f304562aa0d3cfd03c24bf9` | Kevin custom voice |

> ⚠️ Always resolve `look_id` fresh from `group_id` at runtime — never hardcode as primary reference.
> ⚠️ Use `engine: { "type": "avatar_v" }` only via direct `POST /v3/videos`.

---

## Production Workflow

### Step 1 — Script
Write script to `episodes/YYYY-MM-DD/script.md`.
- Target 90–180 seconds for standard videos
- Target 45–60 seconds for Shorts
- Write for spoken delivery, not reading

### Step 2 — Prompt
Select the prompt template from `PROMPT-STYLE-GUIDE.md` that matches the desired energy.
Lock the following before generation:
- Studio background image path
- Avatar group ID + look ID
- Engine: Avatar V
- Voice ID

### Step 3 — Generate
Via `produce.mjs` or direct HeyGen API `POST /v3/videos`.
```json
{
  "video_inputs": [{
    "character": {
      "type": "avatar",
      "avatar_id": "<look_id resolved from group>",
      "avatar_style": "normal"
    },
    "voice": {
      "type": "audio",
      "voice_id": "a149bfff7f304562aa0d3cfd03c24bf9"
    },
    "background": {
      "type": "image",
      "url": "<AAI_Master_Studio_Background_01 CDN URL>"
    }
  }],
  "engine": { "type": "avatar_v" }
}
```

### Step 4 — Quality Review
Before compositing, check generated video against brand standards:

- [ ] Kevin is seated at desk, not floating or misaligned
- [ ] Warm amber lighting visible — no cool tone drift
- [ ] Monitors are visible in background
- [ ] Cowboy hat wall visible
- [ ] Desk edge present in frame
- [ ] No uncanny valley artifacts on face
- [ ] Lip sync within acceptable range

If any check fails: re-prompt with corrective language from style guide. Do not composite a failed generation.

### Step 5 — Composite
Add motion graphics layer from `motion-graphics-extracted/`:
- Lower thirds
- Logo bug (bottom right)
- Subscribe CTA
- Topic headline (if applicable)

### Step 6 — Render + Export
Via `render.mjs`. Output to `episodes/YYYY-MM-DD/final.mp4`.

### Step 7 — Upload
Via `upload_youtube.py` or manual upload.
Tag episode in `heygen-video-log.jsonl`.

---

## What Stays Locked vs What Varies

### LOCKED (never change per video)
- Studio background image
- Avatar group + voice IDs
- Lighting reference (warm amber)
- Desk framing (medium shot default)
- Avatar V engine

### VARIES (changes per video)
- Script / dialogue
- Monitor screen content (can composite)
- Lower thirds text
- Episode topic overlays
- Thumbnail
- Energy prompt modifier (calm vs energized)
- Camera distance (medium / medium-wide / close)

---

## Formats

| Format | Look | Aspect | Framing |
|---|---|---|---|
| YouTube Standard | landscape primary | 16:9 | Medium shot, desk visible |
| YouTube Shorts | portrait | 9:16 | Medium close, tighter crop |
| Thumbnail | still frame | 16:9 | Close-up or expressive frame |
