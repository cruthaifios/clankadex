#!/usr/bin/env bash
# build-package.sh — Build a distributable package for Clankadex.
#
# Usage:
#   ./build-package.sh <output-path> [--os linux|mac|windows]
#
# Examples:
#   ./build-package.sh ~/Desktop/clankadex.deb
#   ./build-package.sh ~/Desktop/clankadex.deb --os linux
#   ./build-package.sh ~/Desktop/clankadex.dmg --os mac
#   ./build-package.sh ~/Desktop/clankadex-setup.exe --os windows
#
# Notes:
#   - Building for macOS requires a macOS host (or Docker with electron-builder).
#   - Building for Windows requires Wine to be installed on Linux/macOS hosts.
#   - Building for Linux (.deb) works natively on any Linux machine.

set -euo pipefail

# ── Argument parsing ──────────────────────────────────────────────────────────
OUTPUT_PATH=""
TARGET_OS="linux"

print_usage() {
  echo "Usage: $0 <output-path> [--os linux|mac|windows]" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --os)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --os requires a value (linux, mac, or windows)" >&2
        exit 1
      fi
      TARGET_OS="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      print_usage
      exit 1
      ;;
    *)
      if [[ -n "$OUTPUT_PATH" ]]; then
        echo "Error: unexpected argument '$1'" >&2
        print_usage
        exit 1
      fi
      OUTPUT_PATH="$1"
      shift
      ;;
  esac
done

if [[ -z "$OUTPUT_PATH" ]]; then
  print_usage
  exit 1
fi

case "$TARGET_OS" in
  linux|mac|windows) ;;
  *)
    echo "Error: --os must be one of: linux, mac, windows" >&2
    exit 1
    ;;
esac

# ── Setup ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Warn about cross-compilation limitations
CURRENT_OS="$(uname -s)"
if [[ "$TARGET_OS" == "mac" && "$CURRENT_OS" != "Darwin" ]]; then
  echo "Warning: Building for macOS from $CURRENT_OS is not supported by electron-builder without Docker."
  echo "         See: https://www.electron.build/multi-platform-build"
  echo "         Continuing anyway — this may fail."
fi
if [[ "$TARGET_OS" == "windows" && "$CURRENT_OS" != "MINGW"* && "$CURRENT_OS" != "CYGWIN"* ]]; then
  if ! command -v wine &>/dev/null; then
    echo "Warning: Building for Windows from $CURRENT_OS requires Wine."
    echo "         Install with: sudo apt install wine (Debian/Ubuntu)"
    echo "         Continuing anyway — this may fail."
  fi
fi

# ── Resolve output path ───────────────────────────────────────────────────────
# Determine expected extension for the target OS
case "$TARGET_OS" in
  linux)   EXPECTED_EXT=".deb" ;;
  mac)     EXPECTED_EXT=".dmg" ;;
  windows) EXPECTED_EXT=".exe" ;;
esac

# If user gave a directory (no extension), append a default filename
OUTPUT_EXT="${OUTPUT_PATH##*.}"
if [[ "$OUTPUT_PATH" == *"$EXPECTED_EXT" ]]; then
  OUTPUT_DIR="$(dirname "$OUTPUT_PATH")"
  OUTPUT_FILE="$OUTPUT_PATH"
else
  # Treat as directory
  OUTPUT_DIR="$OUTPUT_PATH"
  case "$TARGET_OS" in
    linux)   OUTPUT_FILE="$OUTPUT_DIR/clankadex.deb" ;;
    mac)     OUTPUT_FILE="$OUTPUT_DIR/clankadex.dmg" ;;
    windows) OUTPUT_FILE="$OUTPUT_DIR/clankadex-setup.exe" ;;
  esac
fi

mkdir -p "$OUTPUT_DIR"

# ── Install dependencies ──────────────────────────────────────────────────────
echo "Installing dependencies..."
npm install

# ── Build TypeScript sources ──────────────────────────────────────────────────
echo "Building TypeScript (main + renderer)..."
npm run build

# ── Run electron-builder ──────────────────────────────────────────────────────
RELEASE_DIR="$SCRIPT_DIR/release"
rm -rf "$RELEASE_DIR"

echo "Packaging for $TARGET_OS..."
case "$TARGET_OS" in
  linux)
    npx electron-builder --linux deb --publish never
    BUILT_FILE="$(ls "$RELEASE_DIR"/*.deb 2>/dev/null | head -1)"
    ;;
  mac)
    npx electron-builder --mac dmg --publish never
    BUILT_FILE="$(ls "$RELEASE_DIR"/*.dmg 2>/dev/null | head -1)"
    ;;
  windows)
    npx electron-builder --win nsis --publish never
    BUILT_FILE="$(ls "$RELEASE_DIR"/**/*.exe "$RELEASE_DIR"/*.exe 2>/dev/null | grep -v "Uninstall" | head -1)"
    ;;
esac

if [[ -z "${BUILT_FILE:-}" || ! -f "$BUILT_FILE" ]]; then
  echo "Error: electron-builder did not produce an output file in $RELEASE_DIR" >&2
  exit 1
fi

# ── Copy to destination ───────────────────────────────────────────────────────
cp "$BUILT_FILE" "$OUTPUT_FILE"

echo ""
echo "Done! Package saved to: $OUTPUT_FILE"
echo ""
echo "Install on Linux with:"
echo "  sudo apt install \"$OUTPUT_FILE\""
