# ANIMALISTIC — Design

Anime streaming site with community, profile RPG (XP, level, tier), achievements and library.
Platforms: responsive web (Android browser, tablet, desktop). Mobile/desktop shells are not built.

## Direction: Cinematic Dark Anime
Black-first, film-like contrast, silver metallic details, one maroon accent used sparingly.
Large poster/banner imagery does the decorating. Chrome stays quiet.

## Brand & Colors (CSS variables in packages/web/src/web/styles.css)

| Token | Hex | Use |
|-------|-----|-----|
| background | #070707 | Page |
| surface | #111113 | Panels, nav glass base |
| card | #18181B | Cards, inputs |
| border | #26262B | Hairlines |
| silver | #B9BEC7 | Secondary text, icons (inactive) |
| muted | #7C808A | Tertiary text |
| foreground | #F4F4F5 | Primary text |
| maroon | #8B1E2D | Accent: active nav indicator, primary buttons, progress |
| maroon-glow | #B02A3D | Hover / focus ring on maroon |
| moderator | #7C3AED | ONLY the Moderator badge |

Rules: no purple anywhere except the Moderator badge. Gold/other hues only for tier emblems (sparingly).

## Typography
- Display: **Outfit** (700/800) for titles and headings.
- Body/UI: **Manrope** (400/500/600).
- Hierarchy by size and weight. Body line-height 1.6. Titles tight (1.1).

## Layout
- Container max 1280px on desktop, edge padding 16px mobile, 24px tablet.
- Home hero is full-bleed banner with gradient fade to background, text overlapping the fade.
- Horizontal poster rails on mobile, grid on desktop.
- Poster ratio 2:3, banner ratio 16:9.
- Floating bottom nav: fixed, 16px from bottom edge (plus safe-area inset), glass blur, rounded 24px, six items, icon above label, maroon indicator dot/pill for active, silver for inactive. Never covers content: pages get bottom padding.

## Motion
- Page load: staggered fade-up reveal on home sections (40ms step).
- Route transitions: 200ms opacity.
- Nav indicator slides with 250ms ease.
- Respect prefers-reduced-motion.

## States
Every data view has: skeleton (shimmer), empty state (icon + one line + action), error state (message + retry).

## Anti-patterns to avoid
Purple gradients, generic rounded card grids with identical shadows, Inter/Roboto, pastel anime-kawaii styling.
