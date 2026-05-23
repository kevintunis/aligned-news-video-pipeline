# AAI Prompt Style Guide

The prompt is the brand system. This guide is the equivalent of a typography or color style guide — except it governs how AI understands Kevin's world.

---

## Core Spatial Reference

Every prompt should anchor to the studio environment. The AI reads the background image as spatial context. The prompt reinforces that understanding.

**The Studio:**
> Texas Hill Country home office. Live edge walnut desk. Dual monitors showing dark analytics dashboards. Warm amber Edison bulb lighting. Reclaimed wood wall with cowboy hat collection. Illuminated Texas state silhouette. Western leather saddle left foreground. "BUILD AUTOMATE SCALE" desk sign. Cowhide rug. Lush green rolling hills through large window.

Use this block as the environment anchor in any image-to-video or scene setup prompt. Not every element needs to appear every time — but the overall tone must be consistent.

---

## Character Vocabulary

### Presence Descriptors
Use these to describe Kevin's energy and posture.

| Descriptor | When to Use |
|---|---|
| `confident and measured` | Standard delivery — news segments, explainers |
| `warm and direct` | Conversational moments, community updates |
| `authoritative operator` | Product demos, technical breakdowns |
| `calm expert energy` | Educational content, tutorials |
| `energized and forward` | Hook moments, big announcements |

### Posture Vocabulary

| Posture | Prompt Language |
|---|---|
| Default | `seated at live edge desk, hands resting on desk surface` |
| Engaged | `leaning slightly forward, forearms on desk` |
| Gestural | `gesturing with right hand toward monitors` |
| Relaxed | `leaning back slightly, one hand on mug` |
| Direct address | `looking directly into camera, still posture` |

### Prohibited Postures
- Standing
- Arms crossed
- Looking away from camera (unless deliberate cut-away)
- Overly animated / exaggerated gesture

---

## Camera Distance

| Name | Description | Prompt Language | Best Use |
|---|---|---|---|
| Close | Head + shoulders only | `close-up shot, head and shoulders, tight framing` | Emotional beats, hooks |
| Medium | Chest up, desk edge visible | `medium shot, chest up, desk visible at bottom` | Standard delivery |
| Medium Wide | Full torso, monitors visible | `medium wide shot, full torso, both monitors in background` | Tech explainers, context-heavy |
| Environmental | Full room context | `wide establishing shot, full studio environment` | Intros, scene-setting |

**Default:** Medium shot. Only shift for deliberate creative reason.

---

## Lighting Language

The studio has warm, golden-hour practical lighting. Reinforce this in any prompt where lighting is ambiguous.

**Reinforcement phrase:**
> `warm amber practical lighting, motivated by Edison bulb sources, golden tone, no harsh shadows`

**What to avoid:**
> `cool lighting` / `blue tone` / `studio lighting` / `ring light` / `neutral white`

If a generated clip has cool-toned lighting — re-prompt with explicit warm lighting language before accepting.

---

## Cinematic Tone Modifiers

Add to prompts to control the overall feel.

| Modifier | Effect |
|---|---|
| `cinematic, shallow depth of field` | Premium, film-like quality |
| `photorealistic, 4K` | Maximum realism |
| `documentary style` | Grounded, credible |
| `clean and crisp` | Professional, modern |
| `natural motion` | Avoid stiff or robotic movement |

---

## Full Prompt Templates

### Standard YouTube Segment
```
Texas Hill Country AI operator studio. Kevin seated at live edge walnut desk, medium shot, 
hands resting on desk. Warm amber lighting, Edison bulb sources. Dual monitors in background 
showing analytics dashboards. Cowboy hat wall visible. Confident and measured energy. 
Direct address to camera. Cinematic, shallow depth of field. Photorealistic.
```

### Hook / Big Moment
```
Texas Hill Country AI operator studio. Kevin leaning slightly forward at live edge desk, 
close-up framing, head and shoulders. Warm amber lighting. Energized, direct, confident. 
Eyes locked on camera. Cinematic quality. Natural expression. Photorealistic.
```

### Technical Explainer / Demo
```
Texas Hill Country AI operator studio. Kevin at live edge desk, medium wide shot, 
full torso visible, both monitors clearly in background. Warm amber lighting. 
Gesturing toward right monitor. Authoritative operator energy. Documentary style. 
Photorealistic, 4K quality.
```

### Shorts / Vertical Format
```
Texas Hill Country AI operator studio, vertical crop. Kevin at live edge desk, 
medium-close framing optimized for 9:16. Warm amber lighting. Direct address, 
calm expert energy. Clean background composition for vertical format. Photorealistic.
```

---

## Seedance Motion Language

When using Seedance for motion on still frames or scene animation:

| Motion Type | Prompt Language |
|---|---|
| Subtle breathing | `natural subtle breathing motion, minimal camera movement` |
| Ambient room | `warm light flicker, subtle background ambient motion` |
| Head turn | `slight natural head turn left, then return to camera` |
| Hand gesture | `natural hand gesture, smooth arc motion, returns to rest` |
| Camera drift | `very slow gentle push-in, cinematic` |

**Avoid:** Fast panning, jump cuts, dramatic zoom, jitter or shake.

---

## Anti-Pattern Reference

If any of these appear in output — reject and re-prompt.

| Problem | Fix |
|---|---|
| Cool / blue lighting | Add explicit warm amber lighting language |
| Avatar floating / misaligned | Anchor with desk framing language |
| Generic office background | Studio image was not used as anchor — reload it |
| Stiff / robotic motion | Add `natural motion`, `photorealistic` to prompt |
| Wrong avatar appearance | Verify look_id resolved from correct group_id |
| Overly formal attire | Specify `casual professional, earth tones` in character descriptor |

---

## Version Control

When you find a prompt that produces an excellent result:
1. Save it to this document under a named template
2. Note which video it was used in (`heygen-video-log.jsonl`)
3. Never modify a working template — duplicate and modify the copy

The prompt library grows with production. Treat confirmed prompts as locked production assets.
