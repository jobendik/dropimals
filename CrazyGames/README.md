# Dropimals — CrazyGames deploy package

This folder is everything you need to publish **Dropimals** on CrazyGames.

```
CrazyGames/
├─ game/            ← the actual game build — THIS is what you upload (no zip)
│  ├─ index.html    ← entry point, sits at the upload root (required)
│  ├─ assets/       ← bundled JS
│  └─ audio/        ← music + sound effects
├─ SUBMISSION.md    ← copy-paste store listing (title, description, tags, controls…)
└─ README.md        ← this file: how to upload + pre-submit checklist
```

> The `game/` files are a fresh production build (`npm run build:crazygames`,
> Vite `base: './'` so every path is **relative** — a CrazyGames requirement).
> To rebuild after a code change, run `npm run build:crazygames` from the repo
> root and re-copy `dist-crazygames/`'s contents into `game/`.

---

## 1. How to upload (no zip)

CrazyGames takes the raw game files, **not** a `.zip`. In the Developer Portal:

1. Go to **developer.crazygames.com → Add game → HTML5**.
2. In the file/upload area, add the **contents of the `game/` folder** —
   `index.html`, `assets/`, and `audio/`.
   - **`index.html` must end up at the root of the upload.** So upload the files
     *inside* `game/` (select them all, or drag the contents) — do **not** drag
     the `game` folder itself, or the entry point becomes `game/index.html` and
     the game won't load.
3. Fill in the store listing from **`SUBMISSION.md`** (description, controls,
   tags, category, orientation).
4. Upload your cover image(s) + optional gameplay video (see SUBMISSION.md).
5. Set up the leaderboard (see §2) — **do this or scores silently fail.**
6. Submit for QA.

**Size & limits (this build is comfortably inside all of them):**

| Limit (CrazyGames)            | This build         |
|-------------------------------|--------------------|
| Initial download ≤ 50 MB      | ~6.4 MB            |
| Total size ≤ 250 MB           | ~6.4 MB            |
| File count ≤ 1500             | 14 files           |
| Mobile cap ≤ 20 MB            | ~6.4 MB → eligible |

---

## 2. Leaderboard setup ⚠️ required for scores to save

The game submits an **AES-GCM encrypted** score at the end of every run. The
backend rejects submissions unless the encryption key matches the one in the
portal.

1. In the portal, create a leaderboard for Dropimals.
   - **Metric:** Points · **Sort:** Higher is better · **Incremental:** Off
   - Set a sensible cooldown (min seconds between submissions).
2. Copy the leaderboard's **32-byte base64 Encryption Key** from the portal.
3. Paste it into `LEADERBOARD_KEY` in
   [`../src/platform/crazygames.ts`](../src/platform/crazygames.ts), then
   **rebuild** (`npm run build:crazygames`) and re-copy into `game/`.
   - The repo currently ships a placeholder key — it **must** be replaced with
     the portal's real key, or every submission is silently dropped.
4. The client sends `{ encryptedScore, score }` (both fields, already handled).

> Score scale: Pip = 20 … Luna Whale = 20,000. If you ever put test scores on a
> live board, regenerate it so old/new scores don't mix.

---

## 3. SDK integration — already done ✅

The CrazyGames HTML5 **SDK v3** (the current version) is fully wired in. Source:
[`../src/platform/crazygames.ts`](../src/platform/crazygames.ts).

- [x] `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js">` in
      `index.html`'s `<head>`.
- [x] `SDK.init()` is **awaited** on the loading screen before the first frame.
- [x] `loadingStart()` / `loadingStop()` bracket asset prep.
- [x] `gameplayStart()` on run start; `gameplayStop()` on pause / game-over / menu.
- [x] **Interstitial ads only between runs** (never mid-play), and never before
      the first game of a session; the SDK's rate limit is respected.
- [x] Audio mutes on `adStarted`, restores on `adFinished` / `adError`.
- [x] **Honours the platform mute toggle** — `SDK.game.settings.muteAudio` +
      `addSettingsChangeListener`; the master audio bus ducks to silent and
      restores (verified with `?muteAudio=true`). So you can truthfully tick
      *"supports CrazyGames muting audio through SDK"* in the portal.
- [x] **Rewarded** "second chance" revive is optional, only grants on
      `adFinished`, and is hidden when an adblocker is detected (no dead button).
- [x] Fully playable with an adblocker and on a `disabled` SDK domain — every
      SDK call safely no-ops off-platform.
- [x] Encrypted score submitted to the leaderboard at the end of each run.
- [x] Cloud-synced save via the SDK `data` module, with localStorage fallback.
- [x] Personalised greeting for signed-in CrazyGames accounts.

---

## 4. QA checklist

Already handled by the build:

- [x] **Relative asset paths** (`base: './'`) — no absolute URLs.
- [x] Loads fast; tiny Canvas2D bundle runs on low-end Chromebooks.
- [x] `user-select: none` (+ `-webkit-`) and `touch-action: none` set.
- [x] Audio context created/resumed inside a user gesture (iOS-safe).
- [x] Auto-pauses on tab blur (`visibilitychange`).
- [x] Keyboard + mouse + touch all supported; arrow keys work for AZERTY players.
- [x] Clearly labeled buttons; visible goal (mission chip) and score; low-text
      onboarding hint on first drop.

Do these yourself before/at submission:

- [ ] **Replace `LEADERBOARD_KEY`** with the portal key, rebuild, re-copy (§2).
- [ ] Upload **cover image(s)** + optional gameplay video (see SUBMISSION.md).
- [ ] Play a full run on a phone in the portal preview (check overflow + ad flow).
- [ ] Confirm the interstitial and rewarded ad render in the portal QA env.
- [ ] *(Optional polish)* The game also binds **Esc** to pause. CrazyGames
      advises against Esc because it exits fullscreen. It's non-destructive here
      (and `P` + the on-screen pause button work too), so it's fine — but if QA
      flags it, drop the `Escape` binding in
      [`../src/input/input.ts`](../src/input/input.ts) and rebuild.

---

*Generated for CrazyGames submission. The `game/` folder is self-contained and
runs anywhere a static file host can serve it.*
