"""
make_thumbnail.py
Extracts a frame from the episode MP4, overlays Aligned News branding,
and saves a YouTube-ready thumbnail (1280x720, JPEG under 2MB).

Usage:
    python make_thumbnail.py --video episodes/aligned-news-2026-05-19-abc123.mp4 \
                             --headline "OpenAI Drops GPT-5 — Everything Changes" \
                             --badge critical

    python make_thumbnail.py --video episodes/... --headline "..." --badge bullish

Badge options: critical, bullish, signal, vc, action, caution (default: signal)
Output: thumbnail.jpg in the same directory as the video
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

# ── Brand config ──────────────────────────────────────────────────────────────

BADGE_COLORS = {
    "critical": (220, 38,  38),   # red
    "bullish":  (22,  163, 74),   # green
    "signal":   (37,  99,  235),  # blue
    "vc":       (124, 58,  237),  # purple
    "action":   (234, 88,  12),   # orange
    "caution":  (202, 138, 4),    # amber
}

BADGE_LABELS = {
    "critical": "CRITICAL",
    "bullish":  "BULLISH",
    "signal":   "AI SIGNAL",
    "vc":       "VC WATCH",
    "action":   "ACTION",
    "caution":  "CAUTION",
}

THUMB_W, THUMB_H = 1280, 720
FRAME_TIME = "00:00:03"  # extract frame at 3 seconds (good expression point)

# ── Frame extraction ──────────────────────────────────────────────────────────

def extract_frame(video_path: str, out_path: str, timestamp: str = FRAME_TIME):
    """Extract a single frame from the video using ffmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-ss", timestamp,
        "-i", video_path,
        "-vframes", "1",
        "-vf", f"scale={THUMB_W}:{THUMB_H}:force_original_aspect_ratio=increase,crop={THUMB_W}:{THUMB_H}",
        "-q:v", "2",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stderr}")
    if not os.path.exists(out_path):
        raise RuntimeError("ffmpeg ran but no output file was created")


# ── Text helpers ──────────────────────────────────────────────────────────────

def load_font(size: int, bold: bool = False):
    """Load a system font, falling back to PIL default."""
    candidates_bold = [
        "arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    candidates_regular = [
        "arial.ttf", "Arial.ttf", "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    candidates = candidates_bold if bold else candidates_regular
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def wrap_text(text: str, font, draw, max_width: int) -> list[str]:
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines, current = [], []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


# ── Thumbnail compositor ──────────────────────────────────────────────────────

def build_thumbnail(frame_path: str, headline: str, badge: str) -> Image.Image:
    img = Image.open(frame_path).convert("RGB").resize((THUMB_W, THUMB_H), Image.LANCZOS)
    draw = ImageDraw.Draw(img, "RGBA")

    badge_color = BADGE_COLORS.get(badge, BADGE_COLORS["signal"])
    badge_label = BADGE_LABELS.get(badge, "AI SIGNAL")

    # ── Dark gradient overlay (right 55% of image) ────────────────────────────
    overlay = Image.new("RGBA", (THUMB_W, THUMB_H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    # Solid dark panel on right side
    panel_x = int(THUMB_W * 0.40)
    ov_draw.rectangle([panel_x, 0, THUMB_W, THUMB_H], fill=(10, 10, 20, 210))
    # Soft fade on left edge of panel
    for i in range(80):
        alpha = int(210 * (i / 80))
        ov_draw.rectangle([panel_x - 80 + i, 0, panel_x - 79 + i, THUMB_H], fill=(10, 10, 20, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Top bar: ALIGNED NEWS brand ───────────────────────────────────────────
    bar_h = 52
    draw.rectangle([0, 0, THUMB_W, bar_h], fill=(10, 10, 20))
    brand_font = load_font(22, bold=True)
    draw.text((24, 14), "ALIGNED NEWS", font=brand_font, fill=(255, 255, 255))
    # Accent line under brand bar
    draw.rectangle([0, bar_h, THUMB_W, bar_h + 3], fill=badge_color)

    # ── Badge pill ────────────────────────────────────────────────────────────
    badge_font = load_font(18, bold=True)
    badge_text = f"  {badge_label}  "
    bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
    bw = bbox[2] - bbox[0] + 16
    bh = bbox[3] - bbox[1] + 10
    bx = int(THUMB_W * 0.44)
    by = bar_h + 28
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6, fill=badge_color)
    draw.text((bx + 8, by + 5), badge_text.strip(), font=badge_font, fill=(255, 255, 255))

    # ── Headline text ─────────────────────────────────────────────────────────
    headline_font = load_font(54, bold=True)
    text_x = int(THUMB_W * 0.44)
    text_max_w = THUMB_W - text_x - 40
    lines = wrap_text(headline, headline_font, draw, text_max_w)

    # Vertically center the headline block
    line_h = 64
    total_h = len(lines) * line_h
    text_y = (THUMB_H - total_h) // 2 + 20  # slight downward offset from true center

    for i, line in enumerate(lines):
        y = text_y + i * line_h
        # Shadow
        draw.text((text_x + 2, y + 2), line, font=headline_font, fill=(0, 0, 0, 180))
        # Main text
        draw.text((text_x, y), line, font=headline_font, fill=(255, 255, 255))

    # ── Bottom bar ────────────────────────────────────────────────────────────
    from datetime import date
    today = date.today().strftime("%B %d, %Y").upper()
    bottom_font = load_font(18)
    draw.rectangle([0, THUMB_H - 40, THUMB_W, THUMB_H], fill=(10, 10, 20, 200))
    draw.text((24, THUMB_H - 28), f"AI INTELLIGENCE BRIEFING  |  {today}", font=bottom_font, fill=(160, 160, 180))

    # ── Accent stripe on left edge ────────────────────────────────────────────
    draw.rectangle([0, bar_h + 3, 5, THUMB_H], fill=badge_color)

    return img


# ── Save ──────────────────────────────────────────────────────────────────────

def save_thumbnail(img: Image.Image, out_path: str, max_bytes: int = 2 * 1024 * 1024):
    """Save JPEG, reducing quality until under max_bytes (YouTube 2MB limit)."""
    for quality in (95, 85, 75, 65):
        img.save(out_path, "JPEG", quality=quality, optimize=True)
        if os.path.getsize(out_path) <= max_bytes:
            break
    size_kb = os.path.getsize(out_path) // 1024
    print(f"Thumbnail saved: {out_path} ({size_kb} KB)")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Aligned News YouTube thumbnail")
    parser.add_argument("--video",    required=True, help="Path to episode MP4")
    parser.add_argument("--headline", required=True, help="Bold headline text")
    parser.add_argument("--badge",    default="signal",
                        choices=list(BADGE_COLORS.keys()),
                        help="Signal badge type")
    parser.add_argument("--frame-time", default=FRAME_TIME,
                        help="Timestamp to extract frame from (default: 00:00:03)")
    parser.add_argument("--output",   default=None,
                        help="Output path (default: <video_dir>/thumbnail.jpg)")
    args = parser.parse_args()

    video_path = Path(args.video).resolve()
    if not video_path.exists():
        print(f"Video not found: {video_path}")
        sys.exit(1)

    out_path = args.output or str(video_path.parent / "thumbnail.jpg")
    frame_path = str(video_path.parent / "_frame_tmp.jpg")

    print(f"Extracting frame at {args.frame_time}...")
    extract_frame(str(video_path), frame_path, args.frame_time)

    print("Compositing thumbnail...")
    img = build_thumbnail(frame_path, args.headline, args.badge)
    save_thumbnail(img, out_path)

    # Clean up temp frame
    if os.path.exists(frame_path):
        os.remove(frame_path)

    print(f"Done: {out_path}")


if __name__ == "__main__":
    main()
