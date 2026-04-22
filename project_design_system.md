---
name: Hatch Studios Portal — Design System
description: Colours, fonts, and component patterns — applies to both client and admin portals
type: project
originSessionId: 14103b72-69fb-425c-a82d-9d9b5eb892c3
---
## Fonts (Google Fonts)
- **Syne** — headings, logo, stat values, badges. Weights: 400/500/600/700/800
- **DM Sans** — body, nav, inputs, buttons. Weights: 300/400/500 (also italic)

## Colour Palette (CSS variables)

```
--bg: #0a0a0b
--surface: #111113
--surface2: #16161a
--surface3: #1d1d23
--border: rgba(255,255,255,0.06)
--border2: rgba(255,255,255,0.11)
--accent: #f0448a         ← Hatch Studios pink (matched from logo)
--accent-dim: rgba(240,68,138,0.12)
--accent-glow: rgba(240,68,138,0.06)
--orange: #ff6b35         ← Instagram
--purple: #8b6dfa         ← LinkedIn
--green: #3dffa0          ← Live/done status
--red: #ff4d6a            ← YouTube, danger
--blue: #47b8ff           ← TikTok
--yellow: #f5c542         ← Premium plan badge
--text: #f0f0f2
--text2: #9a9aaa
--text3: #6e6e82          ← Muted labels (bumped up from #454550 for readability)
--topbar-bg: rgba(10,10,11,0.85)
--modal-overlay-bg: rgba(0,0,0,0.7)
```

## Light Mode (body.light class)
```
--bg: #f4f4f6
--surface: #ffffff
--surface2: #f0f0f4
--surface3: #e8e8ee
--border: rgba(0,0,0,0.07)
--border2: rgba(0,0,0,0.13)
--text: #0d0d10
--text2: #4a4a5e
--text3: #8a8a9e
--topbar-bg: rgba(244,244,246,0.88)
--modal-overlay-bg: rgba(0,0,0,0.45)
```

Toggle: 🌙/🌑 button in topbar. `body.classList.toggle('light')`

## Layout
- Fixed sidebar (228px client / 240px admin), sticky topbar (60px)
- Page content padding: 32px
- Cards: `border-radius: 16px`, `border: 1px solid var(--border)`
- Stat cards: `border-radius: 14px`

## Key Component Classes
- `.btn-accent` — pink filled button (primary), text `#fff`
- `.btn-ghost` — transparent bordered button (secondary)
- `.nav-item.active` — accent-dim bg + pink left border indicator
- `.ep-status.done/editing/review/upload` — coloured pill badges
- `.clip-card` — 9:16 aspect ratio thumbnail cards
- `.pipe-card` — kanban column cards
- `.cal-event.ig/tt/yt/li` — colour-coded calendar events
- `.plan-badge.plan-core/plan-growth/plan-premium` — plan badges (admin portal)

## Platform Colour Coding
- **IG** (Instagram): orange `#ff6b35`
- **TT** (TikTok): blue `#47b8ff`
- **YT** (YouTube): red `#ff4d6a`
- **LI** (LinkedIn): purple `#8b6dfa`

## Mobile
- Sidebar collapses behind hamburger (3-bar toggle) at ≤768px (client) / ≤900px (admin)
- Dark overlay behind open sidebar
- Tapping any nav item closes sidebar on mobile
- Grid layouts collapse: 4-col → 2-col → 1-col
