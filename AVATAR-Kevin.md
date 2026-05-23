# Avatar: Kevin Tunis

## Appearance
- Age: Late 50s–early 60s
- Gender: Male
- Ethnicity: Caucasian
- Hair: White/silver, short; full white beard
- Build: Medium, distinguished
- Features: Strong presence, expressive, authoritative
- Style: Casual professional — earth tones, relaxed but credible anchor energy
- Reference: Texas Hill Country home office, live edge desk, dual monitors, AI automation context

## Voice
- Tone: Authoritative, warm, conversational
- Accent: American, neutral-to-Southern
- Energy: Measured, confident — news anchor meets tech expert
- Think: Like a seasoned journalist who also builds AI workflows

## HeyGen
- Group ID: `9e2caa59e3984eed9e16c280861f8fd6`
- Voice ID: `a149bfff7f304562aa0d3cfd03c24bf9` (Kevin custom clone)

### Looks (all support avatar_v + avatar_iv engines)

| Key | ID | Name | Type | Orientation | Use |
|---|---|---|---|---|---|
| **🔒 PIPELINE** | `726be335f74947bcab21b32ed692d093` | Kevin AAI Studio — Clean | photo_avatar | landscape | **Daily pipeline — studio BAKED IN** |
| orange_shirt | `9362fcaf0c3b41f69dae9e2797b72132` | Smiling man in orange shirt | photo_avatar | landscape | Retired from pipeline (living room baked in) |
| digital_twin | `9b21eac2911f4ce8a72401a6803c1679` | Kevin Tunis (Digital Twin) | digital_twin | landscape | Alternative — no custom background |
| portrait | `882fcf422d944b4a972495c3475607dd` | Podcast host in black sweater | photo_avatar | portrait | Shorts format |
| blue_shirt | `0be2dddb404a4a869135d2d77681e25f` | Smiling man in blue shirt | photo_avatar | landscape | Alternate landscape |

### Production defaults (run.mjs)
```
AVATAR_ID = '726be335f74947bcab21b32ed692d093'  // Kevin AAI Studio — Clean
VOICE_ID  = 'a149bfff7f304562aa0d3cfd03c24bf9'
ENGINE    = avatar_v  (direct /v3/videos — no Seedance)
BACKGROUND = none needed — studio is baked into the avatar photo
```

### How the studio lock works
The avatar photo is a clean frame extracted at t=1.0s from Seedance test video 014bae0d
(the confirmed "spot on" Texas Hill Country studio video). Avatar V animates Kevin's face
and lip-syncs the voice while the studio environment — hat wall, Texas star, Hill Country
window, live edge desk, dual monitors, Edison bulb lighting — remains perfectly locked
for every episode regardless of script length.

⚠️ DO NOT set a `background` parameter — it will override the baked-in studio.
⚠️ DO NOT use the orange_shirt avatar for the pipeline — it has Kevin's living room baked in.
⚠️ The Digital Twin does NOT lock the studio the same way — do not use it for the daily pipeline.
⚠️ look_ids verified 2026-05-20 via HeyGen MCP API. Studio avatar created 2026-05-20.
