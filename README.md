<p align="center">
  <img src="https://img.shields.io/badge/opencode--viewer-0.1.0-58a6ff?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="opencode-viewer">
</p>

<p align="center">
  Local web UI for browsing and analyzing <code>opencode-interceptor</code> captured LLM request/response data.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="README_zh.md">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TS">
  <img src="https://img.shields.io/badge/Vitest-4-6b9c3e?logo=vitest" alt="Vitest">
</p>

---

## Overview

`opencode-interceptor-viewer` is a local web tool that visualizes intercepted LLM traffic captured by [`opencode-interceptor`](https://github.com/anomalyco/opencode-interceptor). Instead of digging through raw JSON files, you get an interactive timeline with message diffing, markdown rendering, and search.

Each LLM call is split into three files (`*.meta.json`, `*.request.json`, `*.response.json`). This viewer merges them into a coherent, browsable conversation timeline.

## Quick Start

```bash
git clone https://github.com/ColaHikari/opencode-interceptor-viewer.git
cd opencode-interceptor-viewer
npm install
npm run dev            # http://localhost:3000
```

The viewer looks for session directories (`ses_*`) in `tests/fixtures/` by default. To point to your own interceptor data:

```bash
export INTERCEPTOR_DATA_DIR=/tmp/opencode-interceptor/
npm run dev
```

Or use the input field in the web UI.

## Features

### Timeline & Diffing
- Per-request timeline with status, duration, model info, and badge tags
- **Cross-call diffing** — repeated messages auto-folded by contiguous groups; modified messages shown with visual line-diff; new messages highlighted
- System prompt changes detected and shown in the diff
- Message compression handling across calls

### Message Viewer
- **Collapsible** — system prompts and tool results fold by default; long content auto-collapses
- **Markdown + Raw toggle** — every message supports both rendered and source views
- **Syntax highlighting** — code blocks highlighted via `rehype-highlight` (highlight.js)
- **Tool calls** — human-readable display: parsed function name + arguments; grouped with matching tool results
- **Line-level diff** — for modified messages, LCS-based diff with hunk prev/next navigation

### Response Viewer
- **GitHub Flavored Markdown** — tables, task lists, strikethrough via `remark-gfm`
- **Outline panel** — auto-extracted heading tree; click to jump; fixed floating on the right
- **Collapsible long responses** — auto-truncates at 2K chars with an expand button, shows byte size
- **Raw / MD toggle** — switch between rendered markdown and plain-text view

### Search & Filters
- Full-text search across messages, model names, URLs, and response bodies
- Filter by status code (2xx/4xx/5xx/error), empty response, provider, and model

### UX
- **Dark / Light mode** — toggle with localStorage persistence, smooth transitions
- Responsive layout — left sidebar timeline, right detail panel
- Keyboard-accessible — focus-visible outlines on all interactive elements

## Screenshots

### Home — Session List
<img src="docs/screenshots/homepage.png" width="100%" alt="Homepage">

### Session Detail — Overview Tab
<img src="docs/screenshots/session-detail.png" width="100%" alt="Session Detail">

### Request Tab — Message Diffing
<img src="docs/screenshots/request-diff.png" width="100%" alt="Request Diff">

### Request Tab — Markdown + Outline
<img src="docs/screenshots/request-md.png" width="100%" alt="Request Markdown">

### Response Tab — Markdown + Outline
<img src="docs/screenshots/request-md.png" width="100%" alt="Response Markdown">

## Development

```bash
npm test              # unit + integration tests (vitest)
npm run test:e2e      # full-stack e2e smoke tests
npm run lint          # eslint
npm run build         # production build
```

## Project Structure

```
├── app/
│   ├── page.tsx                       # Homepage — session list
│   ├── sessions/[id]/page.tsx         # Session detail — timeline + call viewer
│   ├── api/sessions/route.ts          # GET /api/sessions
│   ├── api/sessions/[id]/route.ts     # GET /api/sessions/:id
│   ├── api/search/route.ts            # GET /api/search?q=
│   ├── globals.css                    # Theme tokens, typography plugin, dark variant
│   └── layout.tsx                     # Root layout with anti-flash theme script
├── components/
│   ├── CallDetail.tsx                 # 5-tab viewer (Overview/Request/Response/JSON)
│   ├── MessageBlock.tsx               # Single message with role badge, fold, MD/Raw toggle
│   ├── MarkdownRenderer.tsx           # Markdown + outline panel + scroll tracking
│   ├── DiffView.tsx                   # LCS line-diff with hunk prev/next navigation
│   ├── ToolCallView.tsx               # Human-readable tool call display
│   ├── JsonViewer.tsx                 # Collapsible JSON tree viewer
│   ├── ThemeProvider.tsx              # Theme context + localStorage persistence
│   └── ThemeToggle.tsx                # Sun/moon icon toggle button
├── lib/
│   ├── parser.ts                      # Server-side — scan dirs, parse JSON, normalize data
│   ├── message-utils.ts               # Client-safe — diffMessages, computeDiff, parseToolCalls
│   ├── types.ts                       # TypeScript type definitions
│   └── utils.ts                       # Shared formatters + MD_PROSE constant
└── tests/
    ├── unit/                          # Unit tests (parser, components)
    ├── integration/                   # API route integration tests
    ├── e2e/                           # Full-stack smoke tests
    ├── fixtures/                      # Real interceptor data + synthetic test data
    └── setup.ts                       # jest-dom matchers
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + `@tailwindcss/typography` |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-highlight` |
| Testing | Vitest 4 + Testing Library |
| Linting | ESLint + `eslint-config-next` |

## License

MIT
