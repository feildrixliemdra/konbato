---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Nothing is ever uploaded — Konbato does its work on your own device, so you can hand it the file you would not hand to a server"
destination: youtube
aspect: 1920x1080
language: en
length: 45s
audience: "people who handle files they would rather not hand to a server — designers, students, office teams, confidential work"
angle: site-tour
narration: no
---

## Intent

A neutral, show-it-as-is tour of Konbato — not a sales pitch. The video features
the site's own captured screens as its assets and walks the viewer through what
is actually there: the hero and its live conversion demo, the 15-tool registry
across two categories, the three-step flow, the privacy claim, and a real tool
workspace. Calm, editorial, technical. Product-UI-forward rather than
illustration-led, because the whole argument is that the interface is the
product.

## Customizations

- **Show-it-as-is (site tour / showcase).** The captured screens are the visual
  source of truth — use the real screenshots rather than rebuilding the site in
  HTML. Internal movement rides on top of a captured screenshot, or rebuilds
  only the one component that moves. No stylized re-interpretation of the pages.
- **Silent.** No narration, no BGM, no SFX. The canonical fully-silent marker
  applies: `music: none` in `STORYBOARD.md` and no `SCRIPT.md`. Step 3.1 is a
  clean skip.
- **On-screen text + captions.** The story is carried by
  typography, the captured screens, and caption copy.
- **On-device processing is the through-line, not a beat.** The user's revision:
  highlight that everything is handled on the user's device and the file is never
  sent anywhere, so confidential files (an image or a PDF) can be processed
  safely. It is stated in frames 1, 5 and 9, proved on an image in frame 3 and on
  a PDF in frame 7, given the longest hold as the centrepiece in frame 6 (the
  site's own DATA PATH card — "0 bytes of your file sent", "YOUR FILE NEVER
  CROSSES"), and explained in frame 8 (the engines run in the page).
- **Tool pages included.** The user pointed at the individual tools, so the tour
  shows real tool workspaces rather than the homepage alone: frame 3 is the live
  Image Compress tool after a real compression run, frame 7 is the live PDF
  Organizer holding a real 3-page document. Both were captured at 1920×1080 by
  driving the running site in light mode, matching the homepage capture.

## Assets

- None supplied. All assets come from the live site capture.

## Notes

- Source URL: https://konbato.vercel.app/
- Product: Konbato — 15 browser-only image/PDF tools. 5 Image, 10 PDF.
- Positioning language is taken from the site itself: "15 tools · No account ·
  No upload step"; "Convert & edit files securely in your browser"; "Your file
  is decoded, processed and re-encoded on this device."
- Proof points available on the page: the live HEIC → WebP demo (−85% smaller,
  "0 bytes uploaded"), "No server uploads", "Nothing to breach", "No queue, no
  throttle", the three-step flow (Open a file → Work on it → Take it back), and
  the animated pipeline diagram (Read → Dispatch → Process → Return).
- Per-tool videos (15) are explicitly deferred — the user will decide after
  reviewing this master video.
