---
format: 1920x1080
duration: 45s
message: "Nothing is ever uploaded — Konbato does its work on your own device, so you can hand it the file you would not hand to a server"
arc: "Demo Loop, on-device thread — promise → the real surface → image on device → breadth → flow → the proof (chamber) → PDF on device → why it can be local → ask"
audience: "people who handle files they would rather not hand to a server — designers, students, office teams, confidential work"
mode: collaborative
music: none
---

**Silent site tour, with one argument.** No narration and no BGM (the fully-silent
marker: `music: none` + no `SCRIPT.md`), so every frame carries its own copy on
screen. The `copy:` field on each frame is the exact on-screen text; the frame
workers set it verbatim and let the shot's reveals pace it.

**The through-line is on-device processing.** It is not one beat — it is the
video's spine, and it is stated or proved in frames 1, 3, 5, 6, 7, 8 and 9.
Frame 6 is the centrepiece and gets the longest hold (8s); frames 3 and 7 exist
to make the claim concrete for the two file types a viewer actually has in hand,
an image and a PDF.

**Show-it-as-is.** The captured screens are the visual source of truth.
Screenshots are never re-drawn as HTML — internal movement rides on the captured
plate. Only the cover (1), the cropped chrome and the authored type are built.

**Capture note — two appearances, one deliberately dark room.** The site runs
`defaultTheme="system"`, so it renders light or dark per OS preference. The
homepage capture is light, and every homepage asset below is light. The exception
is intentional and is documented in `globals.css`: the privacy band is the
"chamber", and its tokens are defined once in `:root` and **never overridden in
`.dark`** — "The chamber is dark in both appearances, because the room is dark
regardless of the canvas around it." So frame 6 is dark in every appearance by
the site's own design, not by a colour choice made here. The task screenshot's
top navigation strip stays light inside that dark band, which is the real page.

**Provenance of the tool screenshots.** Frames 3 and 7 are real captures of the
live tool pages, taken by driving the running site — a real JPEG through Image
Compress, a real 3-page PDF into PDF Organizer — and screenshotting the result at
1920×1080. They are genuine product output, not mockups: every size visible in
frame 3 (`Original: 158.53 KB • Compressed: 87.44 KB`, `Save 45%`) is the tool's
own readout from that run, read off the capture rather than assumed.

**Two figures are authored chrome, not captured.** The `158.53 KB → 87.44 KB`
and `0 BYTES UPLOADED` lines in frame 3 are set in the frame's own type rather
than read off the capture. They report the real result of the run that produced
the screenshot, but they must *fade in*, **never count up** — a counter would
imply a live measurement the frame cannot make, and the capture underneath is a
still.

## Video direction

Written once; every frame inherits it and each frame's Scene lines carry only the
delta. Read this before touching any frame.

- **Palette system** (from `frame.md`; never invent a hue). Ground = cream
  `#FAFCFD`; voice = ink `#080C0F`; the single voltage = Konbato blue `#0069BD`,
  used **once per frame at most** (a CTA, one figure, one stage tag, one rule).
  Half-steps are tile `#EFF2F5` and tile-strong `#E2E7EB`. The chamber is navy
  `#091015` with `#111920` / `#1A232A` surfaces, and it is dark **because the site
  says so** — it is the only ground flip in the film. No second accent hue
  anywhere; nothing saturated that is not the voltage.
- **Motion grammar + reveal model.** Long-tail settles (`power3`) are the default —
  smooth over bouncy; overshoot only where a blueprint's signature move calls for
  it. **Nothing is on screen before its own cue.** This is a silent cut, so the
  cue source is the copy itself: a phrase enters as its own read would begin, and
  the frame's reveals are spread across its **back ~50%**. A frame's entrance
  carries only its first element. No all-at-once entrances, no front-load-then-freeze.
- **Rhythm / held-frame allocation.** Three deliberate held beats, so the film is
  not uniformly busy: **frame 2** is a continuous-motion breather with no reveals
  at all (the camera does the work); **frame 6** is the climax and its final state
  sits **completely still for its last second** (the longest hold in the film);
  **frame 9** resolves and holds. Everything else reveals across its duration.
- **Aliveness during a hold.** At most a low-amplitude **subtle jitter**
  (`sine-wave-loop`, low register) on a settled hero. No breathing, no back-half
  pan or push, no drift for its own sake.
- **Negative list.** Never: a second accent hue · heavy shadow, glow or gradient
  on content · browser chrome, real cursors or device mockups (the captures are
  shown full-bleed — adding chrome would stylise a page that is already real) ·
  a captured page re-drawn as HTML · a fact restated that the capture already
  shows · any figure counting up (the tool screenshots are stills) ·
  **slideshow** (front-load then freeze) · **screensaver** (everything floating
  independently) · `repeat: -1`, `Math.random`, `Date.now`, CSS `@keyframes` for
  motion.
- **Handoffs — there are none.** No element continues across any frame boundary
  in this film. Every seam is the harness-injected `transition_in` and both sides
  move exactly as that transition defines (the lateral pushes at 9.0s and 20.0s
  travel LEFT on both sides; the two blur-crossfades at 24.0s and 32.0s are the
  ground flip seen both ways). No frame should hold, carry or re-place an element
  from its neighbour — each frame's first Scene starts from its own empty ground.
- **Caption band.** Captions are skipped for this cut (silent — no narration, so
  no caption groups). The bottom band is therefore empty and **all content is
  planned into the top ~83%**. The only elements allowed below that line are the
  back-edge chrome rows — the hairline rule plus the URL/counter line in frames 1
  and 9 — which mirror the site's own bottom edge and keep that edge consistent
  across the film.

## Frame 1 — Cover: nothing to leak

- scene: Typographic cover — the site's own headline and eyebrow on the brand canvas, with the mechanism stated beneath
- duration: 4s
- transition_in: cut
- status: animated
- src: compositions/frames/01-cover.html
- type: hook
- persuasion: Direct claim — lead with the differentiator, not the category
- beat: intrigue + clarity
- blueprint: kinetic-type-beats (Adapt)
- focal: (authored type — no asset in this beat)
- roles: none — typography-only frame
- copy: eyebrow `15 TOOLS · NO ACCOUNT · NO UPLOAD STEP`; display `Convert & edit files securely in your browser`; mono line `NO UPLOAD STEP EXISTS, SO THERE IS NOTHING TO LEAK`
- asset_candidates:

Adapt: keep the signature move — a statement building across beats onto a locked
finale — but drop kinetic-type-beats' hard-cut token swap for a single restrained
build, because this cover is calm and editorial rather than percussive. Nothing
is held back for a mid-shot swap; the beats are the four lines arriving in order.
The blueprint runs 3.0–12.9s and this frame is at the floor, so the beats are
tight: four lines over four seconds, no dwell between them.

Catalog: searched `kinetic typography headline reveal` — `kinetic-center-build`
(words push left into a locked centre) and `caption-kinetic-slam` (per-word slam
with alternating directions) both came back, and both are more aggressive than
this cover's register. Hand-authored from the motion vocabulary.

**Shot sequence**

Scene 1 (0.0–1.1s): cream field, nothing else. The eyebrow enters alone at
upper-third via a **staggered arrival cascade** (`waterfall-entry`) — the `✱`
leads by ~0.12s and the words whip up from below, each starting before the
previous settles, resolving composed. Ink type, one size — the eyebrow is not the
hero and must not read as one.

Scene 2 (1.1–3.0s): the display lands as **two lines of arranged type**
(`dynamic-content-sequencing`) — line 1 `Convert & edit files` settles first, line
2 `securely in your browser` follows ~0.18s later on the same long-tail. It is the
frame's only large element and sits left-aligned on the site's own margin, so the
proportions are the page's rather than a video's.

Scene 3 (3.0–3.6s): the mono claim presses up under the headline in the voltage
blue — `NO UPLOAD STEP EXISTS, SO THERE IS NOTHING TO LEAK` — its tracking
settling from wide to the pack's mono tracking. This is the frame's single accent
moment; nothing else in frame 1 is blue.

Scene 4 (3.6–4.0s): the hairline rule draws from the left and the back-edge
chrome row (`https://konbato.com` · `01 / 09`) fades in behind it. Held read — the
frame resolves and sits still; at most subtle jitter keeps it alive.

Open on the claim. The headline is the site's own H1 and the mono line is its own
sentence from the hero sub-paragraph, so the cover is the brand speaking rather
than a title card bolted on. Typography-only — no screenshot and no logo mark,
because the only logo files the capture produced are unverified `logo-*`
candidates and an invented mark would ship off-brand. The wordmark is set in
Manrope.

The display breaks `Convert & edit files / securely in your browser` — v1 of the
sketch let it rag naturally and left line 2 at 57% of line 1, which read as an
afterthought. The headline block sits optically centred with the meta row
anchored to the floor, so the frame's air is distributed rather than pooled in
one hollow band.

## Frame 2 — The site as it is

- scene: The real homepage hero — headline, the blue CTA, and the live conversion card — under a slow push in
- duration: 5s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-hero.html
- type: product_intro
- persuasion: Show-don't-tell proof — the product is the interface, so show the interface
- beat: curiosity → clarity
- blueprint: device-surface-showcase (Adapt)
- focal: assets/scroll-000.png
- roles: scroll-000 = hero (full-bleed background plate, undimmed)
- copy: mono chrome `01 / HOME` only; nothing laid over the headline
- asset_candidates: assets/scroll-000.png — the real homepage hero with the live conversion card (−85% smaller, 0 bytes uploaded)

Adapt: keep the continuous 3D push of the floating-window variant, drop the window —
the capture is shown full-bleed with no device frame or browser chrome, because
adding chrome would re-stylise a page that is already a real screenshot, and the
layout vocabulary bans browser chrome outright. The "surface" is the page itself.

Catalog: searched `browser window screen showcase` — `browser-device-stage` is the
one that fits a hero window and it is rejected for exactly that reason (it supplies
device chrome this shot must not have).

**Shot sequence**

Scene 1 (4.0–9.0s): the entire frame, one move. The captured hero sits full-bleed
at `layered-depth` — the plate, its own card shadowing the ground, and the chrome
row `01 / HOME` floating above at low opacity. A **push / focus / drift** on the
frame root (`multi-phase-camera`) runs the whole five seconds: scale 1.0 → 1.09
with a counter-translateY to −40px, decelerating across the shot rather than
ramping and stopping. **No reveals happen in this frame at all** — it is the
film's continuous-motion breather, allocated in Video direction, and its whole job
is to let the real interface be visited.

The push must never hold: the moment it stops, a capture reads as a slide. No text
over the headline — the page's own type is the product's voice, and re-setting it
would turn a capture into a mockup.

This frame is also where the site's own argument is first visible without being
asserted: the hero's conversion card reads `−85% smaller` and `0 bytes uploaded`
straight off the page.

## Frame 3 — An image, on your device

- scene: The real Image Compress workspace after a run — a 158 KB file in, a finished result out, with the frame's own on-device figures beneath
- duration: 5s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-image.html
- type: feature_showcase
- persuasion: Show-don't-tell proof — the confidentiality claim made concrete on the file type most viewers have in hand
- beat: confidence + relief
- blueprint: device-surface-showcase (Adapt)
- focal: assets/tool-image-result.png
- roles: tool-image-result = hero (full-bleed plate) · the authored figures row = supporting
- copy: eyebrow `ON THIS DEVICE`; mono `0 BYTES UPLOADED`; mono figures `158.53 KB → 87.44 KB`
- asset_candidates: assets/tool-image-result.png — the live Image Compress tool in its "Compression Complete" state: `Save 45%`, `Original: 158.53 KB • Compressed: 87.44 KB`, and the page's own subtitle `Optimize image file size client-side without losing visual quality.`

Adapt (blueprint overridden): story suggested `cursor-ui-demo`, but that
blueprint's signature move is a visible cursor driving the UI, and the capture has
no cursor in it — the file was loaded through the automation interface, not
clicked by hand. Rather than paint on a fake cursor, this frame takes
`device-surface-showcase`, whose job is showing a feature experienced inside its
real interface. Overriding the blueprint keeps the shot honest; inventing a cursor
would not.

**Shot sequence**

Scene 1 (9.0–10.5s): the shot is already mid-seam — the hero exits left as this
plate enters from the right, matched direction and speed (`transition_in:
push-slide LEFT`, the harness owns it). On its own beat the eyebrow
`ON THIS DEVICE` arrives in the voltage blue at upper-third via a **staggered
arrival cascade** (`waterfall-entry`). Nothing of the tool is on screen yet.

Scene 2 (10.5–12.2s): the real tool surface rises into place — a **spring-pop
entrance** (`spring-pop-entrance`) on a long-tail settle, no overshoot, from a
slight scale-down. The surface is the hero at `asymmetric 70/30`: the working
area dominates and the frame's authored type holds the margin. The tool's own
on-screen words are legible inside the capture and are deliberately **not** re-set
in the video's own type: the subtitle reads `Optimize image file size client-side
without losing visual quality.`

Scene 3 (12.2–13.2s): the two authored figures land together, staggered ~0.15s —
`0 BYTES UPLOADED` in the voltage and `158.53 KB → 87.44 KB` in ink. They **fade
in and stop**; under no circumstance do they animate as a counter, because the
plate beneath them is a still and a counting number would claim a live measurement.
This is the frame's single accent moment.

Scene 4 (13.2–14.0s): held read. The frame resolves and sits still; at most
**subtle jitter** (`sine-wave-loop`, low amplitude) keeps it from reading dead.
No push, no breathing.

The first proof beat. This is not the homepage: it is the actual tool, after
actually doing the work. The plate carries the product's own "Compression
Complete" state — `Save 45%`, `Original: 158.53 KB • Compressed: 87.44 KB` — so
the result the viewer sees is the tool's real output rather than a claim made
about one. The frame's own figures beneath it (`0 BYTES UPLOADED`, the same
158.53 → 87.44 pair) are authored chrome reporting that run.

The tool's local-processing promise does **not** appear in this capture. The
sentence `Files are processed 100% locally on your machine.` belongs to the
tool's upload-state dropzone, which is gone once the job finishes — so it cannot
be shown next to a completed result without recapturing the pre-run state, and
this frame deliberately does not fake it. The on-device assertion in this beat is
carried by the frame's own `ON THIS DEVICE` eyebrow and `0 BYTES UPLOADED`
instead. The capture's own quiet backers — the subtitle `Optimize image file size
client-side without losing visual quality.` and the footer line `100% client-side
processing with no uploads required.` — ride along inside the plate.

## Frame 4 — Everything it does

- scene: The registry — 15 tools in two categories — travelled top to bottom as one continuous camera move
- duration: 6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-registry.html
- type: feature_showcase
- persuasion: Value stacking — breadth enumerated at once, so "it does everything I need" lands in one beat
- beat: awe → confidence
- blueprint: transcript-scroll-artifact-reveal (Adapt)
- focal: assets/full-page.png
- roles: full-page = hero (the tall travelling surface) · scroll-012 = supporting (the Image half, section 1) · scroll-024 = supporting (the PDF half, section 2)
- block: component:scroll-camera-story — installs the forced-scroll pass rather than hand-authoring the travel
- copy: eyebrow `REGISTRY`; heading `15 tools, two categories`; mono `5 IMAGE · 10 PDF`; sub-line `NO SIGN-IN AND NO UPLOAD STEP`
- asset_candidates: assets/scroll-012.png — the start of the registry: the heading and the Image tool list; assets/scroll-024.png — the PDF half of the registry; assets/full-page.png — the whole-document plate for the continuous travel

Adapt (blueprint overridden): story suggested `grid-card-assemble`, which
assembles discrete cards into a grid — but this beat is not an assembly, it is a
**traversal of one long real surface**, and `transcript-scroll-artifact-reveal` is
the shape whose signature move is exactly that: the frame travels along one long
full-bleed content surface reading it as evidence. The artifact pivot at the end
of that blueprint is dropped (there is no single artifact to reveal here); the
traversal carries the whole shot. That keeps the capture whole instead of cutting
the registry into invented cards.

Catalog: searched `document page scroll travel` and
`compressed forced scroll tall scene travels past camera` →
**`scroll-camera-story` (component)** does precisely this — a tall scene of
slotted sections travels past the camera, depth layers parallax, and the pass
decelerates into a held final section. Named as the frame's `block` so the worker
installs and slots it rather than rebuilding the travel.

**Shot sequence**

Scene 1 (14.0–16.4s): a plain **crossfade** in, then the count lands — `REGISTRY`,
`15 tools, two categories`, and `5 IMAGE · 10 PDF` — via **per-word staggered
reveal** (`dynamic-content-sequencing`) on the site's own cream ground. The
counts are authored type, not readouts: they **do not count up**. `5 IMAGE · 10
PDF` is the frame's single accent moment.

Scene 2 (16.4–19.2s): the forced-scroll pass begins. The tall plate travels past
the camera top-to-bottom through its two slotted sections — the **Image** half,
then the **PDF** half — with the depth layers parallaxing at different rates and
each section rising as the camera reaches it. One continuous move; **no cut, and
no stitched viewport shots anywhere in this beat**.

Scene 3 (19.2–20.0s): the pass **decelerates into a held final section** — the PDF
half, resting and readable — and the frame holds. The slow-fast-slow tail is the
point: a pass that stops abruptly reads as a scrollbar being released.

Breadth is the argument, so this gets a real travel rather than a cut. The
section boundaries are the registry's own two categories rather than invented
breaks, so the travel exposes the structure of the page instead of decorating it.

## Frame 5 — Three steps, no round trip

- scene: The three numbered stations read left to right by one lateral camera move
- duration: 4s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-steps.html
- type: benefit_highlight
- persuasion: Friction reduction — the workflow is three steps and none of them is a wait
- beat: ease
- blueprint: spatial-pan-stations (Adapt)
- focal: assets/scroll-035.png
- roles: scroll-035 = hero (the plate the stations sit on)
- copy: eyebrow `HOW IT WORKS`; heading `Three steps, no round trip`; `01 Open a file`; `02 Work on it`; `03 Take it back`; tags `NO UPLOAD` · `ON-DEVICE` · `IMMEDIATE`
- asset_candidates: assets/scroll-035.png — the three numbered steps with their tags

Adapt: keep the signature move — pre-placed stations on one canvas traversed by a
single virtual camera, landing held on the last. Two changes: the blueprint's role
list is Hook / Problem / Product_Intro and this frame is a benefit beat, and it runs
7–10s against this frame's 4s, so the three stations are visited on a compressed
pan rather than a leisurely one.

**Shot sequence**

Scene 1 (20.0–20.8s): the seam carries in from the right (`push-slide LEFT`,
matched to frame 4's exit direction), and the eyebrow `HOW IT WORKS` plus the
heading `Three steps, no round trip` land via **staggered arrival cascade**
(`waterfall-entry`). The stations themselves are not in view yet.

Scene 2 (20.8–22.9s): one virtual camera **pan / focus-lock** (`viewport-change`)
travels the stations left to right, centring `01 Open a file`, then
`02 Work on it`, then `03 Take it back`, easing to rest at each before moving on.
Compressed but legible — the ease at each station is what keeps it from reading as
a whip. This is the frame's motion payload.

Scene 3 (22.9–24.0s): held on `03 Take it back`, the three tags fade in left to
right, ~0.2s apart — `NO UPLOAD` · `ON-DEVICE` · `IMMEDIATE`. `NO UPLOAD` is the
frame's single accent moment, because it is the tag that answers the objection the
viewer is carrying. Hold, still.

The page's own numbered columns are already stations on a canvas, so one lateral
pan centres each in turn and lands held on the third. The tags are the site's real
ones, and `NO UPLOAD` and `ON-DEVICE` put the thread inside a workflow beat where
a viewer is already imagining the upload step that never comes.

## Frame 6 — Your files, your device — THE CHAMBER

- scene: The dark privacy band: three claims landing one at a time, then the camera settles on the site's own data-path diagram
- duration: 8s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/06-privacy.html
- type: benefit_highlight
- persuasion: Risk reversal — remove the risk rather than promise to manage it, then prove it with the data path
- beat: relief + trust
- blueprint: kinetic-type-beats (Adapt)
- focal: assets/scroll-047.png
- roles: scroll-047 = supporting (the real plate sitting behind the authored card) · the data-path card = the hero of this beat
- copy: eyebrow `PRIVACY FIRST`; heading `Your files, your device`; claims `No server uploads` · `Nothing to breach` · `No queue, no throttle`; data-path block `DATA PATH` · `0 bytes of your file sent` · `THIS DEVICE` · `YOUR FILE NEVER CROSSES` · `OUTSIDE`; stats `CLIENT-SIDE 100%` · `FILE BYTES SENT 0` · `DATA RETAINED None`
- asset_candidates: assets/scroll-047.png — the dark privacy band carrying the DATA PATH diagram between THIS DEVICE and OUTSIDE

Adapt: keep the signature move — a statement building across full-screen beats onto
a locked finale — and add the blueprint's token-cycle idea in one place: the three
claims are rhythmically alike and land solo, one at a time, each replacing the
previous at full contrast while the earlier ones step back rather than leaving.
The locked finale is the site's own data-path card, which the blueprint's
"spring-pop payoff" slot maps onto exactly.

Catalog: searched `data path privacy diagram` → `data-chart`, `hw-path-text`,
`arc-motion-path`, `offset-path-traveler`. None does this job — the card is the
site's own diagram, and the point of the shot is that it is *the site's*, so it is
hand-authored to reproduce the page's arrangement rather than replaced.

**Shot sequence**

Scene 1 (24.0–25.0s): the ground flips. The light page blurs out and the navy
chamber resolves through a **blur-crossfade** — the film's only ground flip, which
is exactly why the seam is blurred rather than dissolved. The eyebrow
`PRIVACY FIRST` lands during the resolve.

Scene 2 (25.0–29.2s): three claims land **solo, one at a time** on the bare dark
canvas — `No server uploads` at 25.0, `Nothing to breach` at 26.4, `No queue, no
throttle` at 27.8 — each arriving via an **in-place token cycle**
(`discrete-text-sequence`) at full contrast while the claim before it steps back
to ~0.35 opacity, still present rather than gone. Each answers an objection the
viewer arrived with. Heading `Your files, your device` sits above them throughout
as the fixed anchor at `centered`, upper-two-thirds.

Scene 3 (29.2–31.0s): the data-path card resolves in parts, ~0.45s apart — the
`THIS DEVICE` zone with its file rows and progress fill (`stat-bars-and-fills`),
then the crossed rule `✕ YOUR FILE NEVER CROSSES`, then the `OUTSIDE` zone, then
the three stats (`CLIENT-SIDE 100%` · `FILE BYTES SENT 0` · `DATA RETAINED None`)
arriving last. `0 bytes of your file sent` is the frame's single accent moment —
it is the claim the whole video exists to make. No glow and no bloom behind the
card: the card earns its weight by being the only thing on an otherwise empty dark
canvas, and the motion doctrine prefers stillness to added atmosphere.

Scene 4 (31.0–32.0s): **completely still.** The longest hold in the film and the
only place in the video where nothing at all moves — this is the argument in one
card and it has to sit still long enough to be read. No jitter, no drift, no
bloom-off.

The centrepiece and the longest hold, because this is the product's actual
plus-point. The site draws the boundary itself: `THIS DEVICE` on one side,
`OUTSIDE` on the other, a crossed rule reading `YOUR FILE NEVER CROSSES` between
them, `0 bytes of your file sent` above, and `FILE BYTES SENT 0` beneath.

The `✕` on the crossed rule is neutral, not red: red is a fourth hue the palette
does not carry, and it would read as an alarm on a line whose whole job is to
reassure. The smallest type in the card (the `OUTSIDE` line, the stat labels) is
held to a `1.2cqw` floor ≈ 23px at 1920×1080.

## Frame 7 — A PDF, on your device

- scene: The real PDF Organizer workspace with three page previews loaded, under the site's confidential-work line
- duration: 5s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/07-pdf.html
- type: feature_showcase
- persuasion: Show-don't-tell proof + risk reversal — the second file type, and the one people are most careful about
- beat: trust + control
- blueprint: device-surface-showcase (Adapt)
- focal: assets/tool-pdf-workspace.png
- roles: tool-pdf-workspace = hero (full-bleed plate) · the two tool chips = supporting
- copy: eyebrow `CONFIDENTIAL WORK`; heading `Scrub embedded metadata from a file before it leaves your hands.`; mono `A DOCUMENT THAT NEVER LEAVES YOUR MACHINE`; chips `Image Metadata Remover` · `PDF Metadata Remover`
- asset_candidates: assets/tool-pdf-workspace.png — the live PDF Organizer with three real page previews loaded in its workspace

Adapt: as frame 3 — full-bleed, no device frame, no browser chrome. The
blueprint's cursorless stepwise-flow variant is what runs here: the surface is the
hero and the frame's own type steps around it.

**Shot sequence**

Scene 1 (32.0–33.0s): the return of the turn. The navy chamber blurs out and the
light page resolves through a **blur-crossfade** — dark back to light, the mirror
of the seam at 24s, so the film's one ground flip is seen both ways. Eyebrow
`CONFIDENTIAL WORK` lands as the light settles.

Scene 2 (33.0–35.2s): the site's own confidential-work line arrives via
**staggered arrival cascade** (`waterfall-entry`) and is the frame's largest
element: `Scrub embedded metadata from a file before it leaves your hands.` It is
quoted from the page, not written for the video, so the answer to "what about a
confidential PDF?" is the product's own.

Scene 3 (35.2–36.6s): the real PDF workspace rises into place — a **spring-pop
entrance** (`spring-pop-entrance`) from a slight scale-down onto a long-tail
settle, at `asymmetric 70/30` with the type holding the margin. The three page
previews the tool rendered are legible inside the capture; they are evidence, so
nothing is placed over them.

Scene 4 (36.6–37.0s): the two chips fade in left to right — `IMAGE METADATA
REMOVER` · `PDF METADATA REMOVER`. `A DOCUMENT THAT NEVER LEAVES YOUR MACHINE`
is the frame's single accent moment. Hold; no push.

The second half of the proof: an actual PDF workspace holding an actual
three-page document, rendering its page previews in the browser. This is the beat
that answers "but what about a PDF I would not send anywhere?" — and quoting the
site's own `Confidential work` line makes the answer the product's, not the
video's. The chips name the two metadata tools by their real labels.

## Frame 8 — Why it can be local

- scene: The four-stage pipeline as working theater, then the engine table settling as the receipt
- duration: 4s
- transition_in: crossfade
- status: animated
- src: compositions/frames/08-pipeline.html
- type: feature_showcase
- persuasion: Authority by association — the mechanism is what makes the on-device claim credible instead of aspirational
- beat: control
- blueprint: agent-progress-theater (Adapt)
- focal: (authored pipeline — no asset in this beat)
- roles: scroll-059 and scroll-071 = supporting (source of the stage copy, not shown as plates)
- copy: eyebrow `UNDER THE HOOD`; heading `Built for performance`; stages `01 Read` · `02 Dispatch` · `03 Process` · `04 Return`; lane tags `Main thread` · `Worker`; mono `mupdf · WebAssembly · In your browser`
- asset_candidates: assets/scroll-059.png — the performance section with its four-stage pipeline; assets/scroll-071.png — the engine table below it

Adapt: keep the signature move — a machine visibly working, then the receipt
cascading in and checking off. The blueprint's 4.2s floor sits just above this
frame's 4s, so the working state is a single breath rather than a dwell: the
stages light in order and the engine line lands as the receipt. The heavy
loader-and-status-phrase theater is reduced to the four stages themselves, because
this is a quiet editorial tour and not an agent demo.

Catalog: searched `pipeline stages progress theater` → `hw-pipeline` (handwritten
register, wrong), `conic-progress-ring` and `mk-progress-stat` (single-value
readouts, not a stage chain), `device-frame-stage` (device chrome, banned). None
fits, so the chain is hand-authored.

**Shot sequence**

Scene 1 (37.0–38.7s): the seam dissolves the PDF workspace away and the eyebrow
`UNDER THE HOOD` plus heading `Built for performance` land via **staggered arrival
cascade** (`waterfall-entry`). The stage chain is not yet lit — this frame's
theater is the lighting, so nothing may be pre-lit.

Scene 2 (38.7–40.3s): the four stages light **in order**, left to right, ~0.35s
apart — `01 Read` · `02 Dispatch` · `03 Process` · `04 Return` — each arriving via
**spring-pop entrance** (`spring-pop-entrance`) with its lane tag settling after
it. `03 Process` with its `Worker` tag is the frame's single accent moment,
because it is the stage that happens inside the browser — the stage that would
have been a server call in any other product. A thin progress fill
(`stat-bars-and-fills`) advances under the chain as the stages light, so the
frame reads as a machine reporting rather than four labels appearing.

Scene 3 (40.3–41.0s): the receipt holds — `mupdf · WebAssembly · In your browser`
settles last beneath the chain on a long-tail. Held read; still.

The frame that closes the logic: the reason nothing is uploaded is that the
engines *are* in the page — mupdf over WebAssembly inside a worker, running in the
tab. `scroll-059` and `scroll-071` are the source of the stage names and the
engine line; the frame is authored rather than captured because the site's own
pipeline is a labelled diagram, and travelling it would add a second travel beat
three frames after the first.

## Frame 9 — Ready to convert?

- scene: The site's own end band resolving onto the wordmark and the URL
- duration: 4s
- transition_in: crossfade
- status: animated
- src: compositions/frames/09-close.html
- type: cta
- persuasion: Risk reversal + one direct ask — free, no account, nothing to install, nothing sent
- beat: motivation
- blueprint: titlecard-reveal (Adapt)
- focal: (authored end band — no asset in this beat)
- roles: scroll-094 = supporting (source of the closing copy, not shown as a plate)
- copy: heading `Ready to convert?`; sub `Open a tool, drop a file in, and watch what happens when nothing has to leave your machine first.`; button `Browse the tools`; mono `FREE · NO ACCOUNT · NOTHING TO INSTALL`; url `https://konbato.com`
- asset_candidates: assets/scroll-094.png — the closing CTA band with the supported-formats list above it

Adapt (blueprint overridden): story suggested `logo-assemble-lockup`, whose
signature move is a brand mark coming to exist on screen. There is no verified
logo asset — the capture produced only unverified `logo-*` candidates — so a
lockup would mean inventing a mark, which the whole "show it as-is" premise
forbids. `titlecard-reveal` is the honest shape: one clean card revealed with
exactly one restrained move, then a still hold. Low motion is the payload here,
not a deficiency. The wordmark is set in Manrope.

**Shot sequence**

Scene 1 (41.0–41.8s): a plain **crossfade** — the ground does not change, so no
blur is needed. The end band fades up **whole** rather than assembling: this is a
`centered` closing card and its calmness is the point after eight frames of
revelation.

Scene 2 (41.8–43.6s): `Ready to convert?` rises into place on a long-tail, then
the site's own closing sentence fades in under it — `Open a tool, drop a file in,
and watch what happens when nothing has to leave your machine first.` The
sentence restates the whole video in the product's own words, so it is given room
rather than decorated.

Scene 3 (43.6–44.4s): the button `Browse the tools` settles at `centered` — a
short scale 0.96 → 1.0 on a long-tail, no overshoot — and the trust strip
`FREE · NO ACCOUNT · NOTHING TO INSTALL` follows close under it, reading as one
cluster with the button rather than a detached footnote.

Scene 4 (44.4–45.0s): `https://konbato.com` settles last, **in ink rather than the
voltage blue**, so the button remains the frame's single accent moment and the
only thing asking to be clicked. Hold to the end; this is the one frame with a
real exit, and it is the crossfade out.

Close on the page's own end band, whose own sentence happens to restate the whole
video — "nothing has to leave your machine first." Then resolve to the wordmark
plus the URL, so the tour ends where the site ends, on one ask.

---

## Status legend

Frames move `outline` → `built` → `animated`. All nine reached `built` when their
layouts were confirmed on `storyboard.html` v2; the sketch pass is closed. Step 5
moves each to `animated` as its composition lands.

## Blueprint overrides — and why

Four frames do not run the blueprint story-design first suggested. Each override
exists to keep the shot honest to what was actually captured:

| Frame | Suggested | Running | Why |
|---|---|---|---|
| 3 | `cursor-ui-demo` | `device-surface-showcase` | the blueprint's signature move is a visible cursor; the capture has none, and painting one on would fake the UI |
| 4 | `grid-card-assemble` | `transcript-scroll-artifact-reveal` (+ `scroll-camera-story`) | this beat traverses one long real surface, it does not assemble invented cards |
| 6 | `kinetic-type-beats` | `kinetic-type-beats` (kept) | no override — recorded here because its token-cycle move is used for the three claims |
| 9 | `logo-assemble-lockup` | `titlecard-reveal` | no verified logo asset exists; a lockup would mean inventing a brand mark |

## On-device thread map

| Frame | How the claim appears |
|---|---|
| 1 | stated as the hook — "nothing to leak" |
| 3 | proved on an image — the tool's own local-processing line |
| 5 | `NO UPLOAD` / `ON-DEVICE` as step tags |
| 6 | **proved with the data path — the centrepiece** |
| 7 | proved on a PDF, under the site's confidential-work line |
| 8 | explained — the engines run in the page |
| 9 | restated in the site's own closing sentence |

## Deliberate omissions

- **The FAQ** — "Is it safe for confidential documents?" is on-message, but its
  answer is the argument frame 6 already proves; a Q&A accordion is a supporting
  crop, not a beat.
- **The supported-formats list** — evidence for a viewer already deciding.
- **"Four jobs, one constraint"** — Designers / Students / Office teams were cut
  for time, but the **Confidential work** row earned its place and became frame
  7's copy. If the cut grows past 45s, the other three rows are the first thing
  back.
- **The footer** duplicates the registry and the CTA, so no frame features it.
