# Dropimals — CrazyGames store listing (copy & paste)

Everything below maps to a field in the CrazyGames Developer Portal
(**developer.crazygames.com → your game → Game info / Metadata**). Copy each
block straight into the matching field. Tags and categories here are all real,
existing CrazyGames tags (verified against crazygames.com/tags).

---

## Game name / Title
```
Dropimals
```

## Short tagline / Subtitle
```
Drop, merge & evolve a whole zoo of adorable animals!
```

## Description
Paste into the **Description** field. (Plain text — no markdown is rendered on
the game page.)

```
Drop, merge, and evolve a whole zoo of adorable animals in this cozy, addictive physics puzzler!

Match two of the same Dropimal and they evolve into the next cutie — from the tiny Pip all the way up to the mighty Luna Whale. Chain merges for huge combos, trigger Fever Mode to double your points, complete missions for bonus rewards, and fill out your Dropidex collection. Just one rule: keep the box from overflowing past the danger line. How high can you score?

Easy to learn, hard to master — aim with the mouse (or your finger) and drop. That's it.

FEATURES
- 10 hand-drawn animals to discover and evolve, from Pip the chick to the Luna Whale
- Satisfying physics — every drop tumbles, bounces and settles
- Combos & Fever Mode for massive score multipliers
- Missions, daily streaks and a global leaderboard to climb
- A "NUDGE" power to shake the box when you're in a tight spot
- Relaxing music, juicy sound effects and screen-filling confetti
- One-button simple: works great on desktop and mobile

Cozy on the surface, deep on the leaderboard. Can you make the legendary Luna Whale?
```

### Short description (if a brief/summary field is also requested)
```
Drop and merge adorable animals to evolve them into bigger ones! Match two of the same Dropimal, chain combos for huge scores, trigger Fever Mode, and fill your Dropidex — all without letting the box overflow. A cozy, addictive physics merge puzzle. Easy to learn, hard to put down.
```

## Controls / Instructions
Paste into the **Controls** (a.k.a. "How to play" / instructions) field. CrazyGames
asks you to clearly show how the game is controlled, and to support AZERTY
keyboards — both are covered below.

```
MOUSE
- Move left/right to aim
- Click (or release) to drop the Dropimal

TOUCH
- Drag left/right to aim, lift your finger to drop
- Tap the NEXT panel to swap the upcoming Dropimal
- Tap NUDGE to shake the box when it's charged

KEYBOARD
- Left / Right arrows or A / D — aim
- Space, Down arrow or S — drop
- Up arrow or W — swap the next Dropimal
- N — nudge the box
- P or Esc — pause

Match two of the same animal to merge and evolve it. Don't let the pile cross the danger line!
```

### One-line controls (if only a short controls field exists)
```
Aim with the mouse or finger and click/tap to drop. Keyboard: arrows or A/D to aim, Space/Down to drop, Up/W to swap, N to nudge, P to pause.
```

## Category / Genre
**Primary category:**
```
Puzzle
```

## Tags
Select these from the portal's tag picker (all are existing CrazyGames tags).
Listed best-first — if the portal caps the number of tags, keep the top ones.

```
Merge, Puzzle, Casual, Physics, 2048, Relaxing, Cute, Animal, Idle, One Button, Brain, Mouse, Arcade
```

> Note: "Suika", "high score" and "family" are **not** CrazyGames tags, so they
> were intentionally left out. "Animal" is the correct tag (singular), and the
> drop-mechanic tag is "One Button".

## Orientation
```
Portrait
```
Plays on desktop (letterboxed) and in mobile portrait. The canvas auto-scales to
any window size.

## Mobile-friendly
```
Yes
```
Initial download is ~6.4 MB total — well under the 20 MB mobile cap, so the game
is eligible to appear on the CrazyGames mobile homepage.

## Languages
```
English
```
(All UI text is in English; gameplay is language-independent.)

---

## Preview videos — ✅ ready in this folder

Both required preview videos are prepared here and already meet CrazyGames' spec
(1080p, ≤ 20 s, **no audio**, ≤ 50 MB, no black bars):

| File | Resolution | Ratio | Length | Size | Audio |
|------|-----------|-------|--------|------|-------|
| `Dropimals_landscape_video.mp4` | 1920×1080 | 16:9 | 20 s | ~9.7 MB | none |
| `Dropimals_portrait_video.mp4`  | 1080×1620 | 2:3  | 20 s | ~10.9 MB | none |

- The landscape video is the portrait capture centered at full height with a
  zoomed, blurred copy of the same footage filling the sides (the standard fill —
  satisfies CrazyGames' "no black bars top & bottom" rule).
- `Dropimals_portrait_video.original.mp4` is the untouched 34 MB master (kept as a
  backup; do **not** upload it).
- CrazyGames auto-speeds videos slightly and plays them muted, so audio is stripped.

## Cover IMAGES — you still need to supply these

The portal also requires **3 cover images** (the videos above are separate). These
are not in this folder:

- **Landscape (16:9)**, **Portrait (2:3)**, and **Square (1:1)** covers.
- Show 2–3 colorful animals mid-merge with a big score and the FEVER / COMBO
  banner — bright, high-contrast, readable as a small tile. Avoid empty box space,
  the mouse cursor, and any "Play Now"/promo text or third-party logos.
- Grab frames from a live run or reuse the screenshots in `../scripts/shots/`.
  (You can also pull a clean frame from either video with
  `ffmpeg -ss 8 -i Dropimals_landscape_video.mp4 -frames:v 1 cover.png`.)

---

## Quick reference — facts that must stay consistent with the build
- 10 animals, Pip (20 pts) → Luna Whale (20,000 pts).
- Lose condition: the pile resting above the danger line for too long ("overflow").
- Score is submitted to a CrazyGames leaderboard at the end of every run
  (requires the leaderboard key step — see README.md §2).
- Genre is **Puzzle** and must not change after submission (a CrazyGames rule).
