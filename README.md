# Konbato 🛠️

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fkonbato.vercel.app%2F-brightgreen?style=for-the-badge)](https://konbato.vercel.app/)

Konbato is a Next.js app for converting, compressing, and editing images and PDFs **entirely in the browser**. It is built around one job: make common file tasks fast without uploading private files to a server.

---

## ⚡ Key Features

### 📄 PDF Utilities
- **Merge**: Combine multiple PDF files in any order.
- **Split**: Extract specific pages or split a PDF into separate files.
- **Rotate**: Fix the orientation of pages on the fly.
- **Reorder**: Drag-and-drop pages to restructure your documents.
- **Compress**: Shrink PDF file sizes using client-side optimization.
- **Metadata Remove**: Clean author, creator, creation date, and other identifying metadata.
- **PDF to Image**: Rasterize pages to PNG/JPEG images.
- **Image to PDF**: Convert images into a beautifully formatted PDF document.

### 🖼️ Image Utilities
- **Compress**: High-performance client-side image compression.
- **Convert**: Format conversion (PNG, JPEG, WebP, AVIF, etc.).
- **Resize & Crop**: Precise resizing and aspect-ratio cropping.
- **Remove Background**: Clean subject separation and transparency generation.
- **Metadata Remove**: Strip EXIF, geolocation, and camera details.

---

## 🛠️ Technology Stack

- **Core**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Concurrency**: Web Workers (`app/workers/`) for offloading heavy processing from the main UI thread.
- **WebAssembly**: High-performance processing libraries compiled to WASM (e.g., MuPDF) running locally.

---

## 🚀 Running Locally

Get the development server up and running on your local machine:

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands
- **Linting**: `pnpm lint`
- **Production Build**: `pnpm build`
- **Serve Production**: `pnpm start`
- **E2E Tests**: `pnpm exec playwright test`

---

## 🎯 Target Audience & Value Proposition

- **Primary User**: Anyone who needs to convert, compress, or edit a file right now—no account, no waiting, no trust required.
- **The Emotional Promise**: *You are never handing your files to a stranger.* File processing happens completely on your machine.
- **Secondary Users**: Designers optimizing assets, students assembling PDFs, office workers trimming attachments, and developers in a hurry.

---

## ⚖️ Why This Problem?

Dominant tools like *ilovepdf*, *Smallpdf*, and *Convertio* are server-upload-first by design—built before modern WebAssembly and Web Workers existed. This creates real issues:
- Files sit on third-party servers for hours.
- Free tiers are ad-heavy and file-size capped.
- Confidential documents (tax returns, contracts, medical records) are routinely uploaded to random SaaS companies.

**Why now is the time to solve this:**
- **Proven Demand**: Services like `ilovepdf` get millions of visits monthly.
- **Advanced Capabilities**: Modern browser APIs, Web Workers, and WebAssembly can process files at native-like speeds right inside the viewport.
- **Privacy Focus**: With strict regulations (GDPR, HIPAA), users and businesses are increasingly hesitant to upload private files.

---

## 🔍 Existing Alternatives

| Tool             | Model         | Client-side?       | Limitation                        |
| ---------------- | ------------- | ------------------ | --------------------------------- |
| **ilovepdf**     | Freemium SaaS | ❌ Upload required | Files on server; size limits; ads |
| **Smallpdf**     | Freemium SaaS | ❌ Upload required | Aggressive paywalls               |
| **Convertio**    | Freemium SaaS | ❌ Upload required | Strict free-tier limits           |
| **PDF.js**       | Library       | ✅                 | Render-only; no editing           |
| **FFmpeg.wasm**  | Library       | ✅                 | No UI; developer tool             |

**The Konbato Gap**: There is no polished, all-in-one, client-side file tool suite. Squoosh proved the concept for images in 2018; Konbato extends that to PDFs, images, and beyond, with a premium consumer-grade UI.

---

## 🗺️ Scope

* **In scope**: Browser-side image conversion, compression, resizing, cropping, background removal, metadata removal, and PDF merge, split, rotate, reorder, compress, metadata removal, PDF-to-image, and image-to-PDF workflows.
* **Out of scope**: Server-side processing, user accounts, cloud storage, forensic sanitization guarantees, office document conversion, and video tools. Keeping these out ensures privacy, focus, and adherence to browser memory limits.

---

## 💡 Key Assumptions

| Assumption | Why it was made | Risk if wrong |
| ---------- | --------------- | ------------- |
| **Users prefer a private workflow** | Confidential documents are processed daily under strict guidelines (GDPR/HIPAA). | If privacy isn't valued, users might prefer server-side tools with infinite processing power. |
| **Modern browser environment** | WASM and Web Workers require relatively modern browsers (Chrome 94+, Firefox 115+, Safari 15.2+). | Sub-5% of global traffic on older browsers - an acceptable cutoff. |
| **Service Worker caching** | Caching assets ensures instant loading and offline capability. | Slow load times on repeat visits, offline failures, or metered data usage. |

---

## 💬 User Discovery & Feedback Loops

1. **"Walk me through the last time you used a tool like ilovepdf. What were you doing, and what annoyed you?"** — Focuses priority on actual friction points (e.g., file-size limits, ads, security anxiety).
2. **"If this tool was unavailable tomorrow, what would you do instead?"** — Reveals direct competition (e.g., Python scripts for power users, email for non-technical users).
3. **"Have you ever decided not to convert a file because you were uncomfortable uploading it?"** — Gauges whether privacy is a primary value driver.

---

## 🏆 Success & Next Steps

Konbato is successful when users can complete common image and PDF tasks without uploads, crashes, or confusion. 

**Next Steps**:
1. Run local network tests proving no bytes are transmitted to any server.
2. Improve browser memory management for extremely large files.
3. Enhance performance of multi-page rendering under heavy memory load.

