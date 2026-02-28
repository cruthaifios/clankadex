# 🤖 Clankadex

**Your local AI model library.**

Clankadex is a desktop app that makes local AI development faster and less painful. Instead of juggling terminal commands, remembering file paths, and tweaking flags every time you want to run a model — Clankadex gives you one place to manage it all.

- **Organize your models** — Keep a browsable library of every local model you've downloaded (GGUF, etc.) with metadata, notes, and tags.
- **Run models with one click** — Start and stop models through the UI. Terminal output streams live so you can see exactly what's happening.
- **Chat directly** — Talk to your running model right inside the app. No separate terminal windows needed.
- **Benchmark & compare** — Run models against benchmarks and compare performance side by side. *(coming soon)*
- **Take notes** — Attach notes to any model: what it's good at, quirks you've noticed, recommended settings.
- **Adjust settings easily** — Context size, GPU layers, server port — tweak everything from the UI instead of remembering CLI flags.
- **Prerequisites handled** — Clankadex checks for llama.cpp and helps you get it installed if it's missing.

Whether you're experimenting with different model architectures, fine-tuning your own, or just want a clean way to manage a growing collection of GGUF files — Clankadex keeps everything in one place.

---

## Local Build

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **npm** (comes with Node.js)
- **Git**

### Steps

```bash
# Clone the repo
git clone https://github.com/your-username/clankadex.git
cd clankadex

# Install dependencies
npm install

# Build the TypeScript source (backend + frontend)
npm run build

# Launch the app
npm start
```

### Development Mode

For active development, this builds and launches in one step:

```bash
npm run dev
```

### Project Structure

```
Clankadex/
├── src/
│   ├── main/           # Electron main process + Express backend (TypeScript)
│   │   ├── main.ts     # Electron window setup
│   │   ├── server.ts   # Express server + WebSocket
│   │   ├── store.ts    # JSON file read/write for config & models
│   │   └── routes/     # API endpoints (models, config, prerequisites)
│   └── renderer/       # React frontend (TypeScript + TSX)
│       ├── index.html
│       ├── index.tsx
│       ├── api.ts      # Frontend API client
│       ├── types.ts    # Shared type definitions
│       └── components/ # React components (App, Sidebar, AddModel, Settings)
├── data/               # Runtime JSON storage (models.json, config.json)
├── dist/               # Compiled output (gitignored)
├── package.json
├── tsconfig.main.json
├── tsconfig.renderer.json
└── esbuild.renderer.mjs
```

---

## How to Use

### First Launch

1. **Run Clankadex** with `npm start` (or `npm run dev` if developing).
2. **Configure llama.cpp** — Click the **⚙ Settings** button and set the path to your `llama-server` binary. If you don't have llama.cpp installed, Clankadex can check for it via the prerequisites system.
3. **Add your first model** — Click **+ Add Model** and fill in:
   - **Name** — Whatever you want to call it (e.g. "Mistral 7B Q4")
   - **File Path** — Full path to the model file on your system (e.g. `/home/you/models/mistral-7b-q4.gguf`)
   - **Format** — Usually `gguf`
   - **Context Size** — How many tokens of context (default: 2048)
   - **GPU Layers** — Number of layers to offload to GPU (0 = CPU only)

### Running a Model

1. **Select a model** from the sidebar.
2. Click **▶ Start** — Clankadex spawns the llama.cpp server with your configured settings.
3. **Watch the terminal** — Server output streams in real time in the terminal area. You'll see it load the model, allocate memory, and start listening.
4. **Chat** — Once the model is ready, type in the chat input at the bottom and hit Enter (or click Send). Responses appear in the terminal area.
5. Click **■ Stop** when you're done.

### Managing Models

- **Add** as many models as you want — they're stored in `data/models.json`.
- **Remove** a model by clicking the **×** button next to it in the sidebar. This only removes it from Clankadex's library, not from your filesystem.
- **View details** by clicking any model — you'll see its file path, format, context size, and GPU layer config.

### Settings

Access via the **⚙ Settings** button:

- **llama.cpp Path** — Path to the `llama-server` binary.
- **Default Context Size** — Applied to new models when added.
- **Default GPU Layers** — Applied to new models when added.
- **Server Port** — The port llama-server listens on (default: 8080).

All settings are stored in `data/config.json` and persist between sessions.

### Tips

- Only one model can run at a time. Stop the current model before starting another.
- The terminal area keeps a scrolling buffer of output — useful for debugging if a model fails to load.
- If a model won't start, check that the file path is correct and that llama.cpp supports the model format.
