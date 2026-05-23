"""
upload_youtube.py
Uploads an episode MP4 to YouTube and sets a custom thumbnail.
Uses OAuth2 — browser opens on first run to authorize, token saved to .youtube-token.json.

Requirements:
    pip install google-api-python-client google-auth-oauthlib google-auth-httplib2

You need a Google Cloud project with YouTube Data API v3 enabled and
an OAuth2 client_secrets.json (Desktop app type) in this directory.
See: https://developers.google.com/youtube/v3/guides/auth/installed-apps

Usage:
    python upload_youtube.py \
        --video    episodes/aligned-news-2026-05-19-abc123.mp4 \
        --thumbnail episodes/thumbnail.jpg \
        --title    "OpenAI Drops GPT-5 — Everything Changes | AI Automation Research" \
        --description "Today's AI intelligence briefing from AI Automation Research..." \
        --tags     "AI news,OpenAI,GPT-5,artificial intelligence" \
        --badge    critical \
        --privacy  private

    --privacy options: private (default), unlisted, public
    Use private first to review before making public.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from datetime import date

try:
    import google.oauth2.credentials
    import google.auth.transport.requests
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
    import googleapiclient.http
except ImportError:
    print("Missing dependencies. Run:")
    print("  pip install google-api-python-client google-auth-oauthlib google-auth-httplib2")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]

SECRETS_FILE = Path(__file__).parent / "client_secrets.json"
TOKEN_FILE   = Path(__file__).parent / ".youtube-token.json"

CATEGORY_ID = "28"       # Science & Technology
DEFAULT_LANGUAGE = "en"

CHAPTER_TEMPLATE = """
00:00 Introduction
00:08 Lead Signal
01:15 Story Breakdown
02:10 Analysis & Context
02:50 Sign-off

"""

# YouTube channel: https://www.youtube.com/@AIAutomationResearch
DESCRIPTION_FOOTER = """
---
AI Automation Research delivers daily AI intelligence briefings — signals, stories, and analysis from across the AI landscape.

🔔 Subscribe for daily briefings → @AIAutomationResearch
🌐 youtube.com/@AIAutomationResearch

#AINews #ArtificialIntelligence #AIAutomation #AIAutomationResearch
"""

# ── Auth ──────────────────────────────────────────────────────────────────────

def get_credentials():
    """Load saved token or run OAuth2 browser flow."""
    if TOKEN_FILE.exists():
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        creds = google.oauth2.credentials.Credentials(
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri"),
            client_id=data.get("client_id"),
            client_secret=data.get("client_secret"),
            scopes=data.get("scopes"),
        )
        if creds.valid:
            return creds
        # Try refresh
        try:
            creds.refresh(google.auth.transport.requests.Request())
            _save_token(creds)
            return creds
        except Exception:
            pass  # fall through to re-auth

    if not SECRETS_FILE.exists():
        print(f"client_secrets.json not found at {SECRETS_FILE}")
        print("Download it from Google Cloud Console → APIs & Services → Credentials")
        print("Create an OAuth2 client ID (Desktop app type) and download the JSON.")
        sys.exit(1)

    flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
        str(SECRETS_FILE), scopes=SCOPES
    )
    creds = flow.run_local_server(port=0)
    _save_token(creds)
    return creds


def _save_token(creds):
    with open(TOKEN_FILE, "w") as f:
        json.dump({
            "token":         creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri":     creds.token_uri,
            "client_id":     creds.client_id,
            "client_secret": creds.client_secret,
            "scopes":        list(creds.scopes or SCOPES),
        }, f, indent=2)


def build_youtube(creds):
    return googleapiclient.discovery.build("youtube", "v3", credentials=creds)

# ── Upload video ──────────────────────────────────────────────────────────────

def upload_video(youtube, video_path: str, title: str, description: str,
                 tags: list[str], privacy: str) -> str:
    """Upload MP4 and return the YouTube video ID."""
    today = date.today().strftime("%B %d, %Y")

    body = {
        "snippet": {
            "title":                 title,
            "description":           description,
            "tags":                  tags,
            "categoryId":            CATEGORY_ID,
            "defaultLanguage":       DEFAULT_LANGUAGE,
            "defaultAudioLanguage":  DEFAULT_LANGUAGE,
        },
        "status": {
            "privacyStatus":         privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = googleapiclient.http.MediaFileUpload(
        video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=8 * 1024 * 1024,  # 8MB chunks
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    print(f"Uploading: {Path(video_path).name}")
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"  Upload progress: {pct}%", end="\r")

    video_id = response["id"]
    print(f"\nUploaded! Video ID: {video_id}")
    print(f"URL: https://www.youtube.com/watch?v={video_id}")
    return video_id


# ── Set thumbnail ─────────────────────────────────────────────────────────────

def set_thumbnail(youtube, video_id: str, thumbnail_path: str):
    """Upload and set custom thumbnail. Max 2MB JPEG/PNG."""
    size = os.path.getsize(thumbnail_path)
    if size > 2 * 1024 * 1024:
        print(f"Warning: thumbnail is {size // 1024}KB — YouTube limit is 2048KB")

    media = googleapiclient.http.MediaFileUpload(
        thumbnail_path,
        mimetype="image/jpeg",
        resumable=False,
    )

    youtube.thumbnails().set(
        videoId=video_id,
        media_body=media,
    ).execute()

    print(f"Thumbnail set: {Path(thumbnail_path).name}")


# ── Update metadata (optional second pass) ────────────────────────────────────

def update_metadata(youtube, video_id: str, **kwargs):
    """Update title/description/tags after upload if needed."""
    body = {"id": video_id, "snippet": {"categoryId": CATEGORY_ID, **kwargs}}
    youtube.videos().update(part="snippet", body=body).execute()
    print("Metadata updated.")


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_tags(tag_string: str) -> list[str]:
    return [t.strip() for t in tag_string.split(",") if t.strip()]


def build_description(user_description: str, badge: str) -> str:
    badge_line = {
        "critical": "🚨 CRITICAL ALERT — Major AI development",
        "bullish":  "📈 BULLISH SIGNAL — Positive AI momentum",
        "signal":   "📡 AI SIGNAL — Pattern detected",
        "vc":       "💰 VC WATCH — Investment activity",
        "action":   "⚡ ACTION ITEM — Requires attention",
        "caution":  "⚠️ CAUTION — Monitor closely",
    }.get(badge, "📡 AI SIGNAL")

    today = date.today().strftime("%B %d, %Y")

    return f"""{badge_line}

{user_description}
{CHAPTER_TEMPLATE}
Briefing date: {today}
{DESCRIPTION_FOOTER}"""


# ── Log ───────────────────────────────────────────────────────────────────────

def log_upload(entry: dict):
    log_path = Path(__file__).parent / "heygen-video-log.jsonl"
    import datetime
    line = json.dumps({"timestamp": datetime.datetime.utcnow().isoformat(), **entry})
    with open(log_path, "a") as f:
        f.write(line + "\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def verify_channel(youtube):
    """Print the authorized channel name and URL so you can confirm it's the right one."""
    response = youtube.channels().list(part="snippet", mine=True).execute()
    items = response.get("items", [])
    if not items:
        print("WARNING: No channels found on this account.")
        return
    print("\n[OK] Authorized channel(s):")
    for ch in items:
        name   = ch["snippet"]["title"]
        handle = ch["snippet"].get("customUrl", "")
        cid    = ch["id"]
        print(f"   {name}  |  {handle}  |  https://www.youtube.com/channel/{cid}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Upload AI Automation Research episode to YouTube")
    parser.add_argument("--auth-only",   action="store_true",
                        help="Authorize and verify channel only — no upload")
    parser.add_argument("--video",       required=False, help="Path to episode MP4")
    parser.add_argument("--thumbnail",   required=False, help="Path to thumbnail JPEG")
    parser.add_argument("--title",       required=False, default="", help="YouTube video title")
    parser.add_argument("--description", default="",     help="Video description")
    parser.add_argument("--tags",        default="AI news,artificial intelligence,AI briefing,AI automation,AI Automation Research,Kevin Tunis,daily AI news",
                                                         help="Comma-separated tags")
    parser.add_argument("--badge",       default="signal",
                        choices=["critical","bullish","signal","vc","action","caution"],
                        help="Signal badge type (affects description prefix)")
    parser.add_argument("--privacy",     default="private",
                        choices=["private","unlisted","public"],
                        help="Privacy setting (default: private — review before publishing)")
    args = parser.parse_args()

    # Auth-only mode — verify channel, no upload
    if args.auth_only:
        creds   = get_credentials()
        youtube = build_youtube(creds)
        verify_channel(youtube)
        print("Auth complete. Token saved to .youtube-token.json")
        print("Run without --auth-only to upload a video.")
        return

    # Validate inputs
    if not args.video:
        print("--video is required unless using --auth-only")
        sys.exit(1)
    video_path = Path(args.video).resolve()
    if not video_path.exists():
        print(f"Video not found: {video_path}")
        sys.exit(1)

    thumbnail_path = None
    if args.thumbnail:
        thumbnail_path = Path(args.thumbnail).resolve()
        if not thumbnail_path.exists():
            print(f"Thumbnail not found: {thumbnail_path}")
            sys.exit(1)

    tags = parse_tags(args.tags)
    description = build_description(args.description, args.badge)

    print(f"=== AI Automation Research YouTube Upload ===")
    print(f"Video:     {video_path.name}")
    print(f"Title:     {args.title}")
    print(f"Privacy:   {args.privacy}")
    print(f"Thumbnail: {thumbnail_path.name if thumbnail_path else 'none'}\n")

    # Auth
    creds = get_credentials()
    youtube = build_youtube(creds)
    verify_channel(youtube)

    # Upload
    video_id = upload_video(youtube, str(video_path), args.title, description, tags, args.privacy)

    # Thumbnail (non-fatal — requires YouTube channel verification)
    if thumbnail_path:
        try:
            # Small delay — YouTube needs a moment after upload before thumbnail can be set
            time.sleep(3)
            set_thumbnail(youtube, video_id, str(thumbnail_path))
        except Exception as e:
            print(f"Warning: thumbnail upload failed (channel may need verification): {e}")
            print("Video uploaded successfully. Set thumbnail manually in YouTube Studio.")
            print(f"Studio: https://studio.youtube.com/video/{video_id}/edit")

    # Log
    log_upload({
        "video_id":       video_id,
        "youtube_url":    f"https://www.youtube.com/watch?v={video_id}",
        "studio_url":     f"https://studio.youtube.com/video/{video_id}/edit",
        "title":          args.title,
        "privacy":        args.privacy,
        "local_video":    str(video_path),
        "local_thumbnail": str(thumbnail_path) if thumbnail_path else None,
        "status":         "uploaded",
    })

    print(f"\n=== Done ===")
    print(f"Watch:  https://www.youtube.com/watch?v={video_id}")
    print(f"Studio: https://studio.youtube.com/video/{video_id}/edit")
    if args.privacy == "private":
        print("\nVideo is PRIVATE — review in Studio then change to Public when ready.")


if __name__ == "__main__":
    main()
