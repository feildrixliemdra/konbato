# Konbato

**Private image and PDF tools that run entirely in your browser.** No uploads, no accounts, no file-size paywalls.

[![Live App](https://img.shields.io/badge/live-konbato.vercel.app-brightgreen?style=flat-square)](https://konbato.vercel.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#license)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![Processing: 100% client-side](https://img.shields.io/badge/processing-100%25%20client--side-blue?style=flat-square)](#privacy)

## Contents

- [Why Konbato](#why-konbato)
- [Features](#features)
- [Privacy](#privacy)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Testing](#testing)
- [Browser support](#browser-support)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Why Konbato

Most file tools upload your document to a server, hold it there, and meter you on size. Konbato does the opposite: every tool is a static page that processes your file on your own device using WebAssembly, Web Workers, and Canvas APIs.

- **Your bytes never leave the device.** No upload endpoint exists — there is no server-side file handling to trust or to leak.
- **Nothing to sign up for.** Open a tool, drop a file, download the result.
- **No artificial limits.** The ceiling is your browser's memory, not a paywall.

The full product reasoning — problem statement, competitive landscape, scope, and assumptions — lives in [`docs/PRD.md`](docs/PRD.md).

## Features

### PDF tools

| Tool | What it does |
| --- | --- |
| [PDF Organizer](https://konbato.vercel.app/tools/pdf-organizer) | Combine PDFs, reorder pages, rotate, remove, and selectively export in one workspace |
| [Merge PDF](https://konbato.vercel.app/tools/pdf-merge) | Combine multiple PDF documents into a single organized file |
| [Split PDF](https://konbato.vercel.app/tools/pdf-split) | Extract specific pages, or split into separate single-page files delivered as a ZIP |
| [Compress PDF](https://konbato.vercel.app/tools/pdf-compress) | Reduce size via vector metadata purge or canvas rasterization |
| [Rotate PDF](https://konbato.vercel.app/tools/pdf-rotate) | Rotate specific pages by 90-degree steps |
| [PDF Page Reorder](https://konbato.vercel.app/tools/pdf-reorder) | Drag pages into a new sequence and export |
| [PDF Metadata Remover](https://konbato.vercel.app/tools/pdf-metadata-remove) | Clear common PDF info fields and save a scrubbed copy |
| [PDF to Image](https://konbato.vercel.app/tools/pdf-to-image) | Rasterize pages to PNG or JPEG |
| [Image to PDF](https://konbato.vercel.app/tools/image-to-pdf) | Compile PNG, JPEG, WebP, GIF, TIFF, and BMP images into a PDF, with the original image size or an A4/Letter page, portrait or landscape |
| [Add Watermark](https://konbato.vercel.app/tools/pdf-watermark) | Stamp text or image watermarks across pages with a live preview — flattened so they can't be removed |

### Image tools

| Tool | What it does |
| --- | --- |
| [Image Compress](https://konbato.vercel.app/tools/image-compress) | Optimize file size without losing visual quality |
| [Image Converter](https://konbato.vercel.app/tools/image-convert) | Convert between JPG, PNG, WebP, GIF, and TIFF |
| [Image Resize & Crop](https://konbato.vercel.app/tools/image-resize-crop) | Crop by preset or numeric bounds, then resize into PNG, JPG, or WebP |
| [Remove Background](https://konbato.vercel.app/tools/image-remove-bg) | Isolate subjects at full resolution with a local segmentation model |
| [Image Metadata Remover](https://konbato.vercel.app/tools/image-metadata-remove) | Strip EXIF, geolocation, and camera details by re-encoding |

## Privacy

The guarantee is narrow and deliberate: **your file bytes are never transmitted.** All parsing, rendering, and encoding happens in the tab you already have open.

Two things are worth stating precisely, because "client-side" is often used loosely:

- **Static assets are downloaded; your files are not.** The PDF engine fetches its WebAssembly bundle, and Remove Background downloads a ~25 MB model weights file once, then caches it. Those requests carry no user data.
- **The claim is tested, not just asserted.** [`tests/network-privacy.spec.ts`](tests/network-privacy.spec.ts) runs a full tool flow with the network intercepted and fails if a single request goes anywhere other than `localhost`.

Because nothing is uploaded, there is also nothing stored: no accounts, no cloud, no retention window.

## Getting started

### Requirements

- **Node.js** 20.9 or newer (Next.js 16's minimum).
- **pnpm** — the repo is locked to a `pnpm-lock.yaml`.
- A modern browser with WebAssembly and Web Worker support (see [Browser support](#browser-support)).

### Install and run

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Then open a tool, drop a file, and download the result.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server on `http://localhost:3000` |
| `pnpm build` | Production build (all routes prerender statically) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm exec playwright test` | Run the E2E suite (Chromium + WebKit) |
| `pnpm exec playwright test --project=chromium` | Worker-heavy flows — iterate here |
| `PW_DEV_SERVER=1 pnpm exec playwright test` | Test against `pnpm dev` instead of a production build |

## Architecture

Every route is statically prerendered — there are no route handlers, no API endpoints, and no upload path. Heavy work is moved off the main thread into Web Workers that speak a small `READY | PROGRESS | SUCCESS | ERROR` protocol.

```
app/tools/<slug>/page.tsx   One route per tool; drives its worker via useToolTask
app/workers/               image.worker.ts and pdf.worker.ts (WASM + Canvas work)
lib/tools.ts               Registry of the 15 tools (slug, copy, category)
lib/engines.ts             Which engine each tool uses, and where it runs
components/tools/          Tool surfaces: shell, panels, upload zone, error banner
docs/PRD.md                Product scope and reasoning
tests/                     Playwright specs and committed fixtures
```

Adding a tool means a page under `app/tools/<slug>/`, an entry in `lib/tools.ts`, and an entry in `lib/engines.ts` — `tests/engine-map.spec.ts` fails the build if the registries and the directory drift apart.

> The project builds with **webpack, not Turbopack** (`next dev --webpack`). The WASM integrations for MuPDF and pdf.js depend on that config; don't switch bundlers.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui, Hugeicons |
| PDF engine | MuPDF (WASM) and pdf.js |
| Image engine | Canvas / OffscreenCanvas, `utif` for TIFF, `@imgly/background-removal` for segmentation |
| Concurrency | Web Workers, with `JSZip` and `@dnd-kit` on the main thread |
| Tests | Playwright |

## Testing

Playwright is the only test runner — there is no unit-test framework.

```bash
pnpm exec playwright test                            # full suite
pnpm exec playwright test tests/network-privacy.spec.ts   # one spec
```

Specs query by role, aria label, and exact user-facing copy, so renaming a heading or button label usually means updating a spec too. Worker-heavy flows skip WebKit, so iterate with `--project=chromium`. Test fixtures live in `tests/images/` and `tests/files/` and are regenerated by the scripts beside them.

## Browser support

Konbato needs a browser with WebAssembly, Web Workers, and (for some tools) `OffscreenCanvas`. The E2E suite covers Chromium and WebKit; everything else should work but is not exercised in CI.

**Offline use is not supported yet.** Service-worker caching is deliberately deferred (see the roadmap), so the app requires a network connection on first load.

## Roadmap

- [x] Prove the privacy claim with an automated no-egress test
- [ ] Improve memory management for very large files
- [ ] Tune multi-page rendering under memory pressure
- [ ] Offline/PWA mode via a service worker
- [ ] Dark/light theming polish and broader a11y coverage

## License

Released under the [MIT License](LICENSE).

## Acknowledgements

- [MuPDF](https://mupdf.com/) and [pdf.js](https://mozilla.github.io/pdf.js/) — the PDF engines.
- [img.ly background-removal](https://github.com/imgly/background-removal-js) — local subject segmentation.
- [Squoosh](https://squoosh.app/) — proof that serious image processing belongs in the browser.
- [shadcn/ui](https://ui.shadcn.com/) and [Hugeicons](https://hugeicons.com/) — UI primitives and iconography.
