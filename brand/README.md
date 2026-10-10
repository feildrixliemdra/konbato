# Konbato logo

The mark is a **K cut out of a rounded tile**. Its upper arm is a page's folded corner: documents, worked on right here. The K is a real hole, so whatever is behind the tile shows through it. The mark therefore always uses a single colour.

## Files

| File | Use |
|---|---|
| `konbato-symbol.svg` | Primary mark, 40px and up |
| `konbato-symbol-small.svg` | Small cut for 16–40px: larger K, wider gaps |
| `konbato-symbol-dark.svg` | On dark backgrounds (dark-theme blue) |
| `konbato-symbol-black.svg` / `-white.svg` | One-colour: print, stamps, on photos or the brand blue |
| `konbato-horizontal.svg` (+ `-dark`, `-black`, `-white`) | Main lockup: header, README, social |
| `konbato-stacked.svg` (+ `-dark`) | Square-ish spaces: splash, profile cards |
| `konbato-wordmark.svg` | Name alone, when the mark is already nearby |
| `konbato-favicon.svg` | Browser tab (small cut, tight crop); copied to `app/icon.svg` |
| `konbato-app-icon.svg` | Full-bleed square for iOS and Android, which round it themselves |
| `png/` | favicon 16/32/48, apple-touch 180, icon 192/512, horizontal 1200px |

In the app, use `<BrandMark />` (`components/brand-mark.tsx`). It draws in `currentColor`, so `text-primary` follows the theme. Pass `small` below 40px.

## Colour

| | HEX | Token |
|---|---|---|
| Konbato blue | `#0069BD` | `--primary` (light) |
| Konbato blue, dark | `#0089E9` | `--primary` (dark) |
| Ink | `#080C0F` | `--foreground` (light) |
| Ink, dark | `#ECEFF1` | `--foreground` (dark) |

On the brand blue or on busy photos, use the white one-colour mark.

## Type

The wordmark is Manrope ExtraBold (800), tracked −2% and outlined, so no font is needed. The ascenders of k and b line up with the top of the K, and the baseline sits on the K's foot. Manrope is under the SIL Open Font License, which allows logo use.

## Rules

- **Clear space:** keep at least the width of the K's stem (≈ 18% of the tile) free on every side.
- **Minimum size:** 16px for the small cut and 40px for the primary symbol. The horizontal lockup needs a height of at least 24px.
- **Don't:** recolour the K separately from the tile, add outlines, shadows or gradients, stretch it, re-set the wordmark in a live font, or place the blue mark on a mid-blue background.

The mark has not been through a professional trademark search. Do one before registering it.
