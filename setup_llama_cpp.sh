#!/usr/bin/env bash
#
# setup_llama_cpp.sh — Detect NVIDIA/CUDA, install prerequisites,
# build llama.cpp from source, and alias llama-cli.
#
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

LLAMA_INSTALL_DIR="${LLAMA_INSTALL_DIR:-$HOME/llama.cpp}"
CUDA_BACKEND=OFF

# ─── 1. Detect NVIDIA GPU ───────────────────────────────────────────
info "Checking for NVIDIA GPU..."
if command -v nvidia-smi &>/dev/null && nvidia-smi &>/dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    info "Found NVIDIA GPU: ${GPU_NAME}"
    CUDA_BACKEND=ON
elif lspci 2>/dev/null | grep -qi nvidia; then
    warn "NVIDIA hardware detected but nvidia-smi not working."
    warn "Will attempt CUDA setup anyway."
    CUDA_BACKEND=ON
else
    warn "No NVIDIA GPU detected. Will build llama.cpp in CPU-only mode."
fi

# ─── 2. Install system prerequisites ────────────────────────────────
install_packages() {
    local missing=()
    for pkg in "$@"; do
        if ! dpkg -s "$pkg" &>/dev/null; then
            missing+=("$pkg")
        fi
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        info "Installing: ${missing[*]}"
        sudo apt-get update -qq
        sudo apt-get install -y -qq "${missing[@]}"
    else
        info "System packages already installed."
    fi
}

BASE_DEPS=(build-essential cmake git curl wget pkg-config libcurl4-openssl-dev)
info "Checking base build dependencies..."
install_packages "${BASE_DEPS[@]}"

# ─── 3. CUDA toolkit (if NVIDIA detected) ───────────────────────────
if [[ "$CUDA_BACKEND" == "ON" ]]; then
    info "Checking CUDA toolkit..."
    if command -v nvcc &>/dev/null; then
        CUDA_VER=$(nvcc --version | grep -oP 'release \K[\d.]+')
        info "CUDA toolkit already installed: v${CUDA_VER}"
    else
        warn "nvcc not found. Installing CUDA toolkit..."
        # Try the distro package first; fall back to NVIDIA repo
        if apt-cache show nvidia-cuda-toolkit &>/dev/null 2>&1; then
            install_packages nvidia-cuda-toolkit
        else
            info "Adding NVIDIA CUDA repo (ubuntu)..."
            DISTRO=$(source /etc/os-release && echo "${ID}${VERSION_ID}" | tr -d '.')
            ARCH=$(dpkg --print-architecture)
            KEYRING_URL="https://developer.download.nvidia.com/compute/cuda/repos/${DISTRO}/${ARCH}/cuda-keyring_1.1-1_all.deb"
            TMP_DEB=$(mktemp /tmp/cuda-keyring-XXXX.deb)
            wget -qO "$TMP_DEB" "$KEYRING_URL"
            sudo dpkg -i "$TMP_DEB" && rm -f "$TMP_DEB"
            sudo apt-get update -qq
            sudo apt-get install -y -qq cuda-toolkit
        fi
        # Make sure nvcc is on PATH
        if [[ -d /usr/local/cuda/bin ]] && ! echo "$PATH" | grep -q '/usr/local/cuda/bin'; then
            export PATH="/usr/local/cuda/bin:$PATH"
            export LD_LIBRARY_PATH="/usr/local/cuda/lib64:${LD_LIBRARY_PATH:-}"
        fi
        if command -v nvcc &>/dev/null; then
            info "CUDA installed: $(nvcc --version | grep release)"
        else
            err "CUDA install appeared to succeed but nvcc still not found."
            err "You may need to log out/in or add /usr/local/cuda/bin to PATH."
            CUDA_BACKEND=OFF
            warn "Falling back to CPU-only build."
        fi
    fi
fi

# ─── 4. Clone / update llama.cpp ────────────────────────────────────
if [[ -d "$LLAMA_INSTALL_DIR/.git" ]]; then
    info "llama.cpp repo exists at ${LLAMA_INSTALL_DIR}, pulling latest..."
    git -C "$LLAMA_INSTALL_DIR" pull --ff-only || warn "Pull failed; building with existing source."
else
    info "Cloning llama.cpp into ${LLAMA_INSTALL_DIR}..."
    git clone https://github.com/ggerganov/llama.cpp.git "$LLAMA_INSTALL_DIR"
fi

# ─── 5. Build ───────────────────────────────────────────────────────
BUILD_DIR="${LLAMA_INSTALL_DIR}/build"
info "Building llama.cpp (CUDA=${CUDA_BACKEND})..."
cmake -S "$LLAMA_INSTALL_DIR" -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE=Release \
    -DGGML_CUDA="$CUDA_BACKEND" \
    -DLLAMA_CURL=ON

cmake --build "$BUILD_DIR" --config Release -j "$(nproc)"

# Verify binary
LLAMA_CLI="${BUILD_DIR}/bin/llama-cli"
if [[ ! -x "$LLAMA_CLI" ]]; then
    err "Build completed but llama-cli binary not found at ${LLAMA_CLI}"
    exit 1
fi
info "llama-cli built successfully: ${LLAMA_CLI}"

# ─── 6. Shell alias / PATH ──────────────────────────────────────────
SHELL_RC=""
case "${SHELL:-}" in
    */zsh)  SHELL_RC="$HOME/.zshrc" ;;
    */bash) SHELL_RC="$HOME/.bashrc" ;;
    *)      SHELL_RC="$HOME/.bashrc" ;;
esac

ALIAS_LINE="alias llama-cli='${LLAMA_CLI}'"
PATH_LINE="export PATH=\"${BUILD_DIR}/bin:\$PATH\""
MARKER="# >>> llama.cpp >>>"
END_MARKER="# <<< llama.cpp <<<"

# Remove old block if present, then write fresh
if [[ -f "$SHELL_RC" ]]; then
    sed -i "/${MARKER}/,/${END_MARKER}/d" "$SHELL_RC"
fi

{
    echo ""
    echo "$MARKER"
    echo "$PATH_LINE"
    echo "$ALIAS_LINE"
    echo "$END_MARKER"
} >> "$SHELL_RC"

info "Added llama-cli to ${SHELL_RC}"

# Apply in current session
export PATH="${BUILD_DIR}/bin:$PATH"
# shellcheck disable=SC2139
alias llama-cli="$LLAMA_CLI"

# ─── 7. Smoke test ──────────────────────────────────────────────────
info "Running smoke test..."
if "$LLAMA_CLI" --version &>/dev/null || "$LLAMA_CLI" --help &>/dev/null 2>&1; then
    info "✅ llama-cli is working!"
else
    warn "llama-cli built but smoke test inconclusive (may need a model to fully run)."
fi

echo ""
info "════════════════════════════════════════════"
info " Setup complete!"
info " Binary:  ${LLAMA_CLI}"
info " Backend: $([ "$CUDA_BACKEND" = "ON" ] && echo "CUDA (GPU)" || echo "CPU-only")"
info " Restart your shell or run:  source ${SHELL_RC}"
info "════════════════════════════════════════════"
