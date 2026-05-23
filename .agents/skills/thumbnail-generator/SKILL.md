---
name: thumbnail-generator
description: Generates YouTube-ready episode thumbnails (1280×720 JPEG, under 2MB) from the episode MP4. Uses ffmpeg to extract a frame and Pillow to composite Aligned News branding. Implemented in make_thumbnail.py.
---

# Skill: Thumbnail Generator

Generates YouTube thumbnails from episode MP4 files. Implemented in `make_thumbnail.py`.

## Usage

```bash
python make_thumbnail.py \
    --video   episodes/aligned-news-2026-05-22-abc123.mp4 \
    --headline "OpenAI Drops GPT-5 — Everything Changes" \
    --badge   critical \
    --output  episodes/aligned-news-2026-05-22-abc123-thumbnail.jpg
```

**Called automatically by `run.mjs`** via `execFileSync(PYTHON, ['make_thumbnail.py', ...])`.

## Dimensions

- **Output:** 1280×720 JPEG
- **Max size:** 2MB (YouTube limit) — quality reduced iteratively: 95 → 85 → 75 → 65

## Frame Extraction

Uses `ffmpeg` to extract a single frame at `00:00:03` (3-second mark — typically a good expression point):

```bash
ffmpeg -y -ss 00:00:03 -i {video} -vframes 1 \
    -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" \
    -q:v 2 {temp_frame.jpg}
```

## Compositing Layers (Pillow)

1. **Dark overlay panel** — right 55% of image, semi-transparent dark navy (`10, 10, 20, alpha 210`) with 80px soft gradient fade on left edge
2. **Top bar** — full-width dark bar with "ALIGNED NEWS" brand text (22px bold)
3. **Accent line** — 3px colored stripe under top bar (badge color)
4. **Badge pill** — rounded rectangle with badge label (e.g., "CRITICAL", "BULLISH", "AI SIGNAL")
5. **Headline text** — 54px bold, white with 2px black shadow, word-wrapped to fit right panel
6. **Bottom bar** — dark strip with date ("SEPTEMBER 12, 2026")
7. **Left accent stripe** — 5px vertical badge-color stripe on left edge

## Badge Colors

| Badge | Color |
|-------|-------|
| critical | Red `(220, 38, 38)` |
| bullish | Green `(22, 163, 74)` |
| signal | Blue `(37, 99, 235)` |
| vc | Purple `(124, 58, 237)` |
| action | Orange `(234, 88, 12)` |
| caution | Amber `(202, 138, 4)` |

## Requirements

```bash
pip install Pillow
# ffmpeg must be in PATH
```

## Output Location

Thumbnail saved to same directory as the input video: `{video_dir}/{video_name}-thumbnail.jpg` (or `--output` override).
