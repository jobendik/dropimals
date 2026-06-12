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
- Generative ambient music + SFX, fully mutable
- End-of-run pop cascade with bonus points
- CrazyGames SDK v3 integrated

## Development

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

**Stack:** TypeScript · Vite · Canvas 2D (no dependencies at runtime)

## Deploy

Pushes to `main` automatically deploy to GitHub Pages via the workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

For CrazyGames upload, build with `npm run build` and submit the `dist/` folder. Update `vite.config.ts` to `base: '/'` before building for CrazyGames (the `/dropimals/` sub-path is only needed for GitHub Pages).
