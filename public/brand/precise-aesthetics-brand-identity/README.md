# Precise Aesthetics — Brand Identity Package

Complete brand identity system for **preciseaesthetics.com**, owned and operated by PS Medical Aesthetics, LLC.

## What's in this package

```
brand-identity/
├── README.md                                          ← you are here
├── markdown/
│   └── BRAND-IDENTITY.md                             ← full brand system, in-repo source of truth
├── pdf/
│   └── precise-aesthetics-brand-identity.pdf        ← designed brand book for sharing (23 pages)
└── assets/
    └── logos/                                        ← complete logo package (33 files)
        ├── README.md                                 ← logo usage docs
        ├── *.svg                                     ← vector logos in all variants
        ├── *.png                                     ← raster logos at 1x/2x/3x
        ├── favicon.ico, favicon-*.png               ← favicon set
        └── apple-touch-icon.png, android-chrome-*.png
```

## How to use

### For the build (developers, Claude Code)

Drop `markdown/BRAND-IDENTITY.md` into the repo at `design-system/BRAND-IDENTITY.md`.
This sits alongside `MASTER.md`:

- `MASTER.md` = technical design tokens (CSS variables, Tailwind, components)
- `BRAND-IDENTITY.md` = brand strategy, voice, visual direction, applications

When the two conflict, MASTER wins for code, BRAND-IDENTITY wins for brand.

### For sharing (founders, partners, press, designers)

Send `pdf/precise-aesthetics-brand-identity.pdf`. It's a 23-page landscape brand book covering strategy, voice, color, typography, logo system, imagery, motion, applications, and governance.

### For asset use

Drop `assets/logos/` into the project's `public/brand/` folder. See `assets/logos/README.md` for file index and Next.js integration.

## Versioning

Version 1.0 — April 2026.

This is a living document. Update it as the brand evolves. Quarterly review recommended.

## Maintained by

PS Medical Aesthetics, LLC
hello@preciseaesthetics.com
