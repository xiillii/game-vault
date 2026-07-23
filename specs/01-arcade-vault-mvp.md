# SPEC 01 — Arcade Vault MVP visual shell

> **Status:** Draft
> **Depends on:** —
> **Date:** 2026-07-22
> **Objective:** Port the static Arcade Vault HTML/React prototype (references/templates/) into a Next.js App Router MVP with five real routes, reusing the existing mock data and localStorage persistence, with no real gameplay logic.

## Scope

**In:**

- Five routes ported from the prototype screens:
  - `/` — Library (biblioteca): search, category chips, game grid.
  - `/game/[id]` — Game detail (detalle): cover, info, leaderboard.
  - `/game/[id]/play` — Game player (reproductor): fake CRT arena, HUD, auto-incrementing score placeholder, game-over modal, score save.
  - `/login` — Auth (auth): sign in / create account tabs, guest login.
  - `/hall-of-fame` — Hall of Fame (salon): podium, per-game leaderboard tabs, "your rank" row.
- `components/Nav.tsx` ported from `nav.jsx`, using `next/link` + `usePathname` for active-route detection, plus mobile hamburger panel.
- `components/GameCard.tsx` ported from the `GameCard` component in `biblioteca.jsx` (tilt-on-hover card).
- `lib/data.ts`: typed port of `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`), ES module exports (no `window.*` globals).
- `localStorage` persistence kept as-is: `av_user` (current user) and `av_scores` (saved score entries), read/written from client components.
- All interactive screens/components marked `"use client"`.
- Root layout (`app/layout.tsx`) reuses existing font/CSS setup, adds `Nav` and footer (ported from `app.jsx`'s footer markup).
- Spanish UI copy preserved verbatim from templates.

**Out of scope (for future specs):**

- Real gameplay/game engines for any of the 8 games — `GamePlayer` keeps its existing fake auto-score timer exactly as in the template.
- Real authentication/backend — `/login` keeps client-only fake login (`onLogin` sets localStorage, no server call).
- Real multiplayer/social features, sharing, real user accounts, or a real leaderboard backend.
- SEO/metadata per route, sitemap, OpenGraph tags.
- Automated tests.
- Accessibility audit beyond what the templates already have.

## Data model

```ts
// lib/data.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // CSS class name, e.g. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}
export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// localStorage shapes (unchanged from prototype)
// key: "av_user"   -> { name: string } | null
// key: "av_scores" -> Array<{ game: string; score: number; name: string; at: number }>
```

Conventions:

- All identifiers, exports and file names in English; UI copy stays Spanish.
- `GameDetail`/`HallOfFame` derive their leaderboard rows client-side via `seededScores`, same as the prototype — no persisted leaderboard data.

## Implementation plan

1. `lib/data.ts` — port `data.jsx` to typed TS module (`Game`, `ScoreRow` interfaces, `GAMES`, `CATS`, `PLAYERS`, `seededScores`). No UI change yet; unused until wired in.
2. `components/Nav.tsx` — port `nav.jsx` to a client component using `next/link` and `usePathname` for active state, `useState` for mobile panel. Wire into `app/layout.tsx` above `{children}`; wire a `useAuth`-style local hook or simple `localStorage` read for the login/logout button state.
3. `components/GameCard.tsx` — port the `GameCard` tilt-card from `biblioteca.jsx`.
4. `app/page.tsx` — replace placeholder with the Library screen (search input, category chips, game grid using `GameCard`), linking each card to `/game/[id]`.
5. `app/game/[id]/page.tsx` — port `detalle.jsx` (`GameDetail`): cover, tags, stats, leaderboard, "JUGAR AHORA" linking to `/game/[id]/play`.
6. `app/game/[id]/play/page.tsx` — port `reproductor.jsx` (`GamePlayer`): HUD, CRT arena, fake score timer, pause/end, game-over modal with score save to `localStorage` (`av_scores`).
7. `app/login/page.tsx` — port `auth.jsx` (`Auth`): sign-in/create-account tabs, guest button, writes `av_user` to `localStorage`, redirects to `/` on submit.
8. `app/hall-of-fame/page.tsx` — port `salon.jsx` (`HallOfFame`): per-game tabs, podium, table, "your rank" row read from `av_user`.
9. `app/layout.tsx` — add footer markup ported from `app.jsx`'s `<footer>`.
10. Manual pass: click through all 5 routes, verify nav active states, localStorage login/logout, score save flow, mobile hamburger panel.

## Acceptance criteria

- [ ] `npm run dev` starts with no console errors on any of the 5 routes.
- [ ] `/` shows the game grid; typing in the search box filters by title; clicking a category chip filters by category.
- [ ] Clicking a game card navigates to `/game/[id]` and shows that game's title, description, stats and a 10-row leaderboard.
- [ ] Clicking "JUGAR AHORA" on `/game/[id]` navigates to `/game/[id]/play`.
- [ ] On `/game/[id]/play`, the score HUD auto-increments while not paused; "PAUSA" stops it and toggles to "REANUDAR"; "FIN" opens the game-over modal.
- [ ] Submitting a name in the game-over modal saves an entry to `localStorage["av_scores"]` and shows the "PUNTUACIÓN GUARDADA" confirmation.
- [ ] `/login` lets a user submit a username and redirects to `/`, after which Nav shows the username instead of "Iniciar Sesión".
- [ ] Clicking the username button in Nav signs out (clears `localStorage["av_user"]`) and Nav reverts to "Iniciar Sesión".
- [ ] `/hall-of-fame` shows a podium (top 3) and full table for the first game by default; switching tabs changes the game shown; a signed-in user sees a highlighted "your rank" row.
- [ ] Nav's active link (Biblioteca / Salón de la Fama) matches the current route, including when on `/game/[id]` or `/game/[id]/play` (both count as Biblioteca active).
- [ ] Resizing below 840px collapses Nav links into the hamburger panel, which opens/closes correctly.

## Decisions

- **Yes:** real Next.js App Router routes (`/`, `/game/[id]`, `/game/[id]/play`, `/login`, `/hall-of-fame`) instead of the prototype's hash-based client router. Idiomatic App Router, real URLs, working back button.
- **No:** keeping the hash-router / single `App.jsx` shell. Fights against App Router conventions for no benefit in an MVP.
- **Yes:** English route/file names, Spanish UI copy kept verbatim. Matches project convention of English code, Spanish content (see README).
- **Yes:** everything client-side (`"use client"`) rather than a server/client split. Simpler reasoning for an MVP; every screen needs `useState`/`localStorage` anyway.
- **Yes:** reuse `app/globals.css` and `next/font/google` setup already in the repo — it's already a faithful port of `styles.css` and the template's Google Fonts. No rework needed.
- **Yes:** `lib/data.ts` as typed ES module, dropping `window.GAMES` etc. globals from the prototype. Fits Next.js module system; no reason to keep globals.
- **Yes:** keep `GamePlayer`'s fake auto-score timer and fake CRT arena exactly as in the template. Explicitly requested — visual placeholder only, real gameplay is future work.
- **No:** real authentication backend. Out of scope for this MVP; `av_user` in `localStorage` is sufficient to demo the UI states.

## What is **not** in this spec

- Real gameplay engines for any of the 8 games.
- Real authentication/backend.
- Multiplayer, social, sharing features.
- Per-route SEO/metadata, sitemap, OpenGraph.
- Automated tests.

Each one of those, if it lands, goes in its own spec.
