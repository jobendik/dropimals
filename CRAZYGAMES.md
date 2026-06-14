# Dropimals — CrazyGames submission guide

Everything needed to publish Dropimals on CrazyGames and pass review on the first
try. Build with `npm run build:crazygames`, then zip the **contents** of
`dist-crazygames/` (the files, not the folder) and upload in the developer portal.

---

## 1. Store listing / metadata

Copy-paste these into the developer portal.

**Title:** `Dropimals`

**Short tagline:** `Drop, merge & evolve adorable animals!`

**Description:**
> Drop, merge, and evolve a whole zoo of adorable animals in this cozy, addictive
> physics puzzler! Match two of the same Dropimal and they evolve into the next
> cutie — from tiny Pip all the way up to the mighty Luna Whale. Chain merges for
> huge combos, trigger Fever Mode for double points, complete missions, and fill
> your Dropidex. How high can you score before the box overflows?
>
> 🐤 10 hand-drawn animals to discover
> 🔥 Combos & Fever Mode for massive scores
> ⭐ Daily streaks, missions & a global leaderboard
> 🎮 One-button simple — drop with a click or tap

**Genre:** Puzzle
**Tags:** `merge`, `puzzle`, `casual`, `physics`, `relaxing`, `cute`, `animals`,
`idle`, `2048`, `suika`, `high-score`, `one-button`, `family`

**Controls (for the listing's controls field):**
- **Mouse / Touch:** Move to aim, click or tap to drop. Tap the NEXT panel to swap.
- **Keyboard:** ←/→ or A/D to aim · Space/↓ to drop · W/↑ to swap · N to nudge · P to pause

**Orientation:** Portrait (works on desktop letterboxed, and mobile portrait).
**Mobile-friendly:** Yes — initial download is well under the 20 MB mobile cap.

### Thumbnail / cover art (you must provide images)
- Capture from `scripts/shots/` or a live run. Show **2–3 colorful animals mid-merge
  with a big score and the FEVER/COMBO banner** — bright, high-contrast, readable as
  a small thumbnail. Avoid lots of empty box.
- Required sizes per the portal (typically a square icon + a 16:9 cover). Keep the
  logo legible at small sizes; no third-party IP.

---

## 2. Leaderboard setup ⚠️ (do this or scores silently fail)

The game submits an **AES-GCM encrypted** score at the end of every run
([src/platform/crazygames.ts](src/platform/crazygames.ts)). The backend rejects
submissions unless the encryption key matches.

1. In the portal, create a leaderboard for Dropimals.
   - **Metric type:** Points · **Sort:** Higher is better · **Incremental:** Off
   - Set a sensible **Cooldown Interval** (min seconds between submissions).
2. Generate / copy the leaderboard's **32-byte base64 Encryption Key**.
3. Paste that exact key into `LEADERBOARD_KEY` in
   [src/platform/crazygames.ts](src/platform/crazygames.ts) and rebuild.
   - The placeholder currently in the repo **must** be replaced with the portal's key.
4. The client sends `{ encryptedScore, score }` — both fields are required (fixed).

> **Score scale note:** the point economy was scaled ×10 for juicier numbers
> (Pip = 20 … Luna Whale = 20,000). If you ever had test scores on a live board,
> regenerate the board so old/new scores aren't mixed.

---

## 3. QA / approval checklist

Status of each CrazyGames requirement against this build.

### Technical — ✅ already handled
- [x] `SDK.init()` awaited on the loading screen before first render.
- [x] `gameplayStart()` on run start; `gameplayStop()` on pause / game-over / menu.
- [x] `loadingStart()` / `loadingStop()` bracket asset prep.
- [x] **Relative asset paths** — the `crazygames` build emits `base: './'`.
- [x] Bundle is tiny (~19 KB gzipped JS + small audio); far under the 50 MB initial
      / 250 MB total / 1500 file limits, and under the 20 MB mobile cap.
- [x] Runs on Chrome/Edge; Canvas2D is light enough for a 4 GB Chromebook.
- [x] `user-select: none` (all prefixes) + `touch-action: none` set in `index.html`.
- [x] Audio context is created/resumed inside a user gesture (iOS-safe).
- [x] Works on a `disabled` SDK domain (e.g. GitHub Pages) — all SDK calls no-op.
- [x] Auto-pauses on tab blur (`visibilitychange`).

### Ads — ✅ already handled
- [x] Interstitial only **between runs** (a logical break), never mid-play.
- [x] SDK's 1-midgame-per-3-min limit respected (we just request; SDK throttles).
- [x] No interstitial before the **first** game of a session.
- [x] Audio muted on `adStarted`, restored on `adFinished`/`adError` (correct timing).
- [x] Rewarded "second chance" is **optional** — game is fully playable without it,
      reward only granted on `adFinished`, and the offer is hidden when an adblocker
      is detected (no dead button).
- [x] Fully playable with an adblocker; Basic Launch (`adsDisabledBasicLaunch`)
      degrades gracefully.

### Quality / UX — ✅ already handled
- [x] Low-text onboarding hint on first drop; controls shown in-context.
- [x] Clear labeled buttons, visible goal (mission chip), readable score.
- [x] In-game sound + music toggles with volume sliders, persisted.
- [x] Keyboard + mouse + touch all supported; arrow keys work for AZERTY players.
- [x] Personalised greeting for signed-in CrazyGames accounts.

### Before you submit — manual
- [ ] Replace `LEADERBOARD_KEY` with the portal key (see §2).
- [ ] Upload thumbnail + cover art.
- [ ] Play a full run on a phone in the portal preview (check overflow + ad flow).
- [ ] Confirm the interstitial and rewarded ad render in the portal's QA environment.

---

## 4. Post-launch levers (optional, for ranking)

CrazyGames ranks on retention, session length, and "happy" engagement signals.
The game already fires `happytime()` on discoveries, new bests, Fever, and score
milestones. Further ideas, not yet built:

- **Medium-rectangle banner** on the menu / game-over screen (`SDK.banner`) for
  extra revenue — only on fully-visible UI, never over gameplay.
- **Daily reward escalation** beyond the current streak head-start.
- **Weekly leaderboard season** callouts (boards reset Mondays 09:00 UTC).
