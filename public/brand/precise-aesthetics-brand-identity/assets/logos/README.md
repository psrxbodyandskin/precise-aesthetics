# Precise Aesthetics — Logo Package

Master brand assets for **preciseaesthetics.com** and PS Medical Aesthetics, LLC.

> These are working SVGs generated for immediate site use. For premium print
> applications (large-format event signage, embossed letterhead, packaging),
> commission a brand designer to redraw in a true vector tool with hand-kerned
> Fraunces letterforms.

---

## File Index

### Horizontal lockup (primary brand mark)
Use across the site, signage, decks, partner co-branding.

| File | Use case |
| --- | --- |
| `precise-aesthetics-horizontal-cream.svg` | Primary on midnight backgrounds (homepage hero, launch page, dark footer) |
| `precise-aesthetics-horizontal-cream.png` (1×, 2×, 3×) | Same, raster fallback |
| `precise-aesthetics-horizontal-navy.svg` | Primary on bone/light backgrounds (about, contact, light pages) |
| `precise-aesthetics-horizontal-navy.png` (1×, 2×, 3×) | Same, raster fallback |
| `precise-aesthetics-horizontal-black.svg` | Print, single-color, embossing, fax |
| `precise-aesthetics-horizontal-black.png` (1×, 2×) | Same, raster fallback |
| `precise-aesthetics-horizontal-white.svg` | On photography or rich color backgrounds |
| `precise-aesthetics-horizontal-white.png` (1×, 2×) | Same, raster fallback |

### Standalone monograms

| File | Use case |
| --- | --- |
| `precise-aesthetics-monogram-circle-dark.svg` | Social avatars (LinkedIn, IG, X), app icon |
| `precise-aesthetics-monogram-circle-dark-512.png` | Most platforms |
| `precise-aesthetics-monogram-circle-dark-1024.png` | High-res platforms |
| `precise-aesthetics-monogram-circle-light.svg` | Light-mode avatar contexts |
| `precise-aesthetics-monogram-circle-light-1024.png` | Same, raster |
| `precise-aesthetics-monogram-cream.svg` | Tight-space mark on midnight (no enclosing circle) |
| `precise-aesthetics-monogram-navy.svg` | Tight-space mark on bone |

### Favicon set (Next.js + browsers)

| File | Use case |
| --- | --- |
| `favicon.svg` | Modern browsers (vector, dark-mode-aware via container) |
| `favicon.ico` | Legacy browsers (16/32/48/96 multi-res) |
| `favicon-16.png` | Browser tab |
| `favicon-32.png` | Browser tab retina |
| `favicon-48.png`, `favicon-96.png` | Bookmarks, taskbar |
| `apple-touch-icon.png` (180×180) | iOS home screen |
| `android-chrome-192.png`, `android-chrome-512.png` | PWA, Android |

---

## Next.js Integration

Drop the favicon set into `app/` per Next 15 convention:

```
app/
├── favicon.ico              ← legacy browsers
├── icon.svg                 ← rename favicon.svg here for SVG support
├── apple-icon.png           ← rename apple-touch-icon.png
└── manifest.webmanifest     ← see below
```

Create `app/manifest.webmanifest`:

```json
{
  "name": "Precise Aesthetics",
  "short_name": "Precise",
  "icons": [
    { "src": "/android-chrome-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0C1426",
  "background_color": "#FAF7F2",
  "display": "standalone"
}
```

For inline header/footer logos, import the SVG as a React component:

```tsx
import LogoCream from '@/public/brand/precise-aesthetics-horizontal-cream.svg';
import LogoNavy  from '@/public/brand/precise-aesthetics-horizontal-navy.svg';

// In Header:
<Image src={LogoNavy} alt="Precise Aesthetics" priority height={40} />
```

Place all SVGs/PNGs in `public/brand/`.

---

## Usage Rules

### Do
- Maintain clear space around the lockup equal to the height of the "P" in the wordmark
- Use SVG everywhere possible; PNG only as fallback or for fixed-size raster uses
- Use the cream variant on midnight backgrounds
- Use the navy variant on bone backgrounds
- Use the black variant for any single-color print application

### Do not
- Recolor the marks outside the approved palette
- Skew, rotate, or stretch the lockup
- Add drop shadows, gradients, or effects
- Place on cluttered photography without a tinted overlay
- Use the soft-blue tagline on dark backgrounds (use cream tagline on dark)

---

## Color Tokens (from MASTER.md)

| Role | Hex | Token |
| --- | --- | --- |
| Midnight (background) | `#0C1426` | `--pa-midnight-800` |
| Navy (text on light) | `#0A0F1C` | `--pa-ink-900` |
| Cream (text on dark) | `#F4F0E8` | `--pa-cream-100` |
| Brand blue (accent) | `#A8C8E8` | `--pa-blue-300` |
| Brand blue (mid) | `#5891CA` | `--pa-blue-500` |
| Bone (background) | `#FAF7F2` | `--pa-bone-100` |

---

## Trademark Notice

Precise Aesthetics™ and Precise Pico™ are trademarks of PS Medical Aesthetics, LLC.
File trademark registrations before launch (Aug 8, 2026).
