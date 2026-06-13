# Dropimals

**Drop, merge, and evolve adorable animals in this addictive physics puzzle game.**

Play free in your browser: [jobenw.github.io/dropimals](https://jobenw.github.io/dropimals)

## How to play

Drop animals into the box. When two animals of the same kind touch, they merge into the next evolution — from tiny Pip all the way up to the mighty Luna Whale. Chain merges for combos, fill the Fever meter for double points, and use the Nudge power-up when the pile gets precarious.

- **Desktop** — mouse to aim, click to drop; keyboard arrows/WASD to aim, Space/S to drop, W/Up to swap, N to nudge, Escape/P to pause
- **Mobile** — tap to aim & drop, tap the NEXT panel to swap animals

## Features

- 10 unique hand-drawn animal tiers, each with squash-and-stretch physics
- Fever mode (x2 points), Combo multiplier, daily streak system
- Dropidex — collect all animals across sessions, undiscovered shown as silhouettes
- Original looping soundtrack + synthesized Web Audio SFX, fully mutable
- End-of-run pop cascade with bonus points
- Second chance — once per run, watch a rewarded ad to clear space and keep going
- CrazyGames SDK v3: loading/gameplay events, interstitial + rewarded ads,
  encrypted leaderboard scores, and cloud-synced saves via the data module

## Development

```bash
npm install
npm run dev               # dev server on http://localhost:5173
npm run build             # GitHub Pages build → dist/
npm run build:crazygames  # CrazyGames build → dist-crazygames/
npm run preview           # preview the production build locally
```

**Stack:** TypeScript · Vite · Canvas 2D (no dependencies at runtime)

## Deploy

**GitHub Pages** — pushes to `main` deploy automatically via the workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**CrazyGames** — run `npm run build:crazygames` and submit the zipped contents of `dist-crazygames/`. This build uses relative asset paths (required by CrazyGames) automatically, so no manual config edits are needed. The CrazyGames SDK is loaded from their CDN in [index.html](index.html) and must not be bundled.

> **Leaderboard key:** scores are AES-GCM encrypted in [src/platform/crazygames.ts](src/platform/crazygames.ts) with `LEADERBOARD_KEY`. The exact same 32-byte base64 key must be entered for this game in the CrazyGames developer portal, or submitted scores will be rejected.
