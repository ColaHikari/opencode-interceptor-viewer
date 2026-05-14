<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/opencode--viewer-0.1.0-58a6ff?style=for-the-badge&logo=nextdotjs&logoColor=white">
    <img alt="opencode-viewer" src="https://img.shields.io/badge/opencode--viewer-0.1.0-0969da?style=for-the-badge&logo=nextdotjs&logoColor=white">
  </picture>
</p>

<p align="center">
  A local web UI for browsing and analyzing <code>opencode-interceptor</code> captured LLM request/response data.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#project-structure"><strong>Structure</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Vitest-4-6b9c3e?logo=vitest" alt="Vitest 4">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

<br>

## Overview

`opencode-interceptor-viewer` visualizes intercepted LLM traffic captured by `opencode-interceptor`. Instead of digging through raw JSON files, you get an interactive timeline with message diffing, markdown rendering, and search.

Each LLM call in the interceptor is split into three files (`*.meta.json`, `*.request.json`, `*.response.json`). This viewer merges them back into a coherent, browsable conversation timeline.

## Features

### Message Timeline & Diffing
- **Per-request timeline** — ordered list of all calls in a session with status, duration, model info
- **Cross-call diffing** — compare consecutive requests: see only new/modified messages; repeated messages are folded into groups
- **System prompt diff** — shows exact changes between system prompts (e.g. model name updates)
- **Message compression detection** — when messages are truncated or summarized across calls

### Request Viewer
- **Collapsible messages** — system prompts and tool results fold by default; long content auto-collapses
- **Markdown + Raw toggle** — every message supports both markdown-rendered and plain-text views
- **Tool call display** — human-readable tool invocations with parsed arguments, expandable
- **Tool results** — grouped with their corresponding calls for context
- **Diff view** — LCS-based line diffs for modified messages, with hunk navigation (prev/next)

### Response Viewer
- **Markdown rendering** — with GitHub Flavored Markdown (tables, task lists, strikethrough) and syntax highlighting
- **Outline panel** — auto-extracted heading tree; click to jump; floats on the right side
- **Raw / MD toggle** — switch between rendered and source views
- **Collapsible long bodies** — auto-truncates at 2K chars with expand button
- **Size indicator** — shows response body byte size

### Search & Filtering
- **Full-text search** — across messages, model names, URLs, and response bodies
- **Status filter** — 2xx / 4xx / 5xx / error
- **Response filter** — has body / empty
- **Provider & model filter** — narrow down by provider and model name

### UX
- **Dark / Light mode** — toggle with persistent preference (localStorage)
- **Smooth transitions** — theme switch, scroll, expand/collapse
- **Responsive layout** — left sidebar timeline, right detail panel
- **Keyboard-friendly** — focus-visible outlines on all interactive elements

## Quick Start

```bash
# Clone & install
git clone https://github.com/ColaHikari/opencode-interceptor-viewer.git
cd opencode-interceptor-viewer
npm install

# Development server (with HMR)
npm run dev
# Open http://localhost:3000

# Production build
npm run build && npm start
```

### Point to your data

The viewer looks for session directories (prefixed with `ses_`) in `tests/fixtures/` by default. To use your own interceptor data:

```bash
# Option 1: Set environment variable
export INTERCEPTOR_DATA_DIR=/tmp/opencode-interceptor/
npm run dev

# Option 2: Enter the path in the web UI
```

## Development

```bash
# Unit & integration tests
npm test                    # vitest run (excludes e2e)

# E2E tests (requires build)
npm run test:e2e           # starts next dev, runs smoke tests

# Lint
npm run lint

# Build
npm run build
```

## Project Structure

```
├── app/
│   ├── page.tsx                  # Session list homepage
│   ├── sessions/[id]/page.tsx    # Session detail (timeline + detail)
│   ├── api/sessions/route.ts     # Session list API
│   ├── api/sessions/[id]/route.ts# Session detail API
│   ├── api/search/route.ts       # Search API
│   ├── globals.css               # Theme variables, typography plugin
│   └── layout.tsx                # Root layout with anti-flash theme script
├── components/
│   ├── CallDetail.tsx            # Call viewer with overview/request/response/json tabs
│   ├── MessageBlock.tsx          # Single message with diff type, fold, md/raw toggle
│   ├── MarkdownRenderer.tsx      # Markdown + outline panel + syntax highlighting
│   ├── DiffView.tsx              # LCS line-diff with hunk navigation
│   ├── ToolCallView.tsx          # Human-readable tool call display
│   ├── JsonViewer.tsx            # Expandable JSON tree viewer
│   ├── ThemeProvider.tsx         # Theme context + localStorage persistence
│   └── ThemeToggle.tsx           # Dark/light mode toggle button
├── lib/
│   ├── parser.ts                 # Server-side file parsing (fs-based)
│   ├── message-utils.ts          # Client-safe diff/pure functions
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Shared formatters + MD_PROSE constant
└── tests/
    ├── unit/                     # Unit tests (parser, components)
    ├── integration/              # API route integration tests
    ├── e2e/                      # End-to-end smoke tests
    ├── fixtures/                 # Real interceptor capture + synthetic test data
    └── setup.ts                  # Vitest setup (jest-dom matchers)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + `@tailwindcss/typography` |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) + [rehype-highlight](https://github.com/rehypejs/rehype-highlight) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| Linting | [ESLint](https://eslint.org/) + `eslint-config-next` |

## License

[MIT](LICENSE)
