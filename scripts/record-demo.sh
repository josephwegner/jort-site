#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROJECT_DIR=${SCRIPT_DIR:h}
APP_PATH=${JORT_APP:-"$PROJECT_DIR/Jort.app"}
OUTPUT_DIR=${OUTPUT_DIR:-"$PROJECT_DIR/recordings"}
OUTPUT_NAME=${OUTPUT_NAME:-jort-demo}
DISPLAY_INDEX=${DISPLAY_INDEX:-4}
FRAME_RATE=${FRAME_RATE:-30}
PM_WAIT_SECONDS=${PM_WAIT_SECONDS:-15}
REWRITE_WAIT_SECONDS=${REWRITE_WAIT_SECONDS:-30}
WINDOW_X=${WINDOW_X:-80}
WINDOW_Y=${WINDOW_Y:-80}
WINDOW_WIDTH=${WINDOW_WIDTH:-1200}
WINDOW_HEIGHT=${WINDOW_HEIGHT:-760}
DISPLAY_SCALE=${DISPLAY_SCALE:-2}

if [[ ! -d "$APP_PATH" ]]; then
  print -u2 "Jort app not found at: $APP_PATH"
  exit 1
fi

if ! command -v ffmpeg >/dev/null; then
  print -u2 "ffmpeg is required. Install it with: brew install ffmpeg"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/jort-demo.XXXXXX")
RAW_FILE="$WORK_DIR/raw.mov"
MP4_FILE="$OUTPUT_DIR/$OUTPUT_NAME.mp4"
WEBM_FILE="$OUTPUT_DIR/$OUTPUT_NAME.webm"

FFMPEG_PID=""

cleanup() {
  [[ -n "$FFMPEG_PID" ]] && kill -INT "$FFMPEG_PID" 2>/dev/null || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT INT TERM

print "Preparing Jort..."
osascript "$SCRIPT_DIR/record-demo.applescript" prepare "$APP_PATH"

print "Recording display $DISPLAY_INDEX..."
ffmpeg -hide_banner -loglevel warning -y \
  -f avfoundation -capture_cursor 0 -pixel_format nv12 \
  -i "$DISPLAY_INDEX:none" \
  -vf "fps=$FRAME_RATE" -fps_mode cfr \
  -c:v libx264 -preset ultrafast -crf 15 -pix_fmt yuv420p \
  "$RAW_FILE" &
FFMPEG_PID=$!

sleep 1
if ! kill -0 "$FFMPEG_PID" 2>/dev/null; then
  wait "$FFMPEG_PID"
  exit 1
fi

print "Typing demo..."
osascript "$SCRIPT_DIR/record-demo.applescript" record \
  "$PM_WAIT_SECONDS" "$REWRITE_WAIT_SECONDS"

if ! kill -0 "$FFMPEG_PID" 2>/dev/null; then
  wait "$FFMPEG_PID"
  exit 1
fi

kill -INT "$FFMPEG_PID"
wait "$FFMPEG_PID" || true
FFMPEG_PID=""

print "Encoding cropped MP4 and WebM..."
CAPTURE_X=$((WINDOW_X * DISPLAY_SCALE))
CAPTURE_Y=$((WINDOW_Y * DISPLAY_SCALE))
CAPTURE_WIDTH=$((WINDOW_WIDTH * DISPLAY_SCALE))
CAPTURE_HEIGHT=$((WINDOW_HEIGHT * DISPLAY_SCALE))
VIDEO_FILTER="crop=${CAPTURE_WIDTH}:${CAPTURE_HEIGHT}:${CAPTURE_X}:${CAPTURE_Y},scale=${WINDOW_WIDTH}:${WINDOW_HEIGHT}:flags=lanczos"

ffmpeg -hide_banner -loglevel warning -y -i "$RAW_FILE" \
  -vf "$VIDEO_FILTER" \
  -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -movflags +faststart "$MP4_FILE"

ffmpeg -hide_banner -loglevel warning -y -i "$RAW_FILE" \
  -vf "$VIDEO_FILTER" \
  -an -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 "$WEBM_FILE"

print "Created:"
print "  $MP4_FILE"
print "  $WEBM_FILE"
