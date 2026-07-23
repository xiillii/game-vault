# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault — a platform for playing games online and competing for the highest score (see README.md, in Spanish). Currently an unmodified `create-next-app` scaffold; no application code has been written yet.

## Critical: read the local Next.js docs before writing code

This repo pins `next@16.2.11`. Per AGENTS.md, treat this as a version whose APIs/conventions may diverge from your training data — **do not rely on memorized Next.js knowledge**. Before implementing routes, data fetching, layouts, or config, check the docs vendored at `node_modules/next/dist/docs/`:

- `01-app/` — App Router (getting started, guides, API reference)
- `02-pages/` — Pages Router
- `03-architecture/` — fast refresh, compiler, accessibility, supported browsers
- `04-community/`

Heed any deprecation notices found there.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint.config.mjs)
```

No test framework is configured yet.

## Skills

Always use /frontend-design to design the user interface.

## Architecture

- **App Router** (`app/`) with TypeScript, `app/layout.tsx` as the root layout and `app/page.tsx` as the home route.
- **Path alias**: `@/*` maps to the repo root (see `tsconfig.json`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`, `app/globals.css`). No `tailwind.config` file — v4 uses CSS-based configuration.
- **Fonts**: Geist Sans/Mono loaded via `next/font/google` in `app/layout.tsx`.
- **ESLint**: flat config composed from `eslint-config-next` (`core-web-vitals` + `typescript`).

## Spec-driven workflow

This project follows spec-driven design using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills, installed via:

```bash
npx skills@latest add Klerith/fernando-skills
```

Prefer these skills' workflow (spec first, then implementation) when adding new features.
