# SPEC 02 — Home page landing

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-07-23
> **Objective:** Replace the current "/" library screen with the hero-driven landing page ported from references/templates/home-about/home.jsx, moving the existing library grid to /biblioteca and adding an "Inicio" link to Nav.

## Scope

**In:**

- Nueva pantalla Home en `/` (`app/page.tsx`), portada de `home.jsx`: hero con silhouettes flotantes, sección "¿POR QUÉ ARCADE VAULT?" (features), preview de juegos (mini-cards), stats, "ACTIVIDAD EN VIVO" (ticker + top jugadores), precios, CTA final.
- Biblioteca actual (grid + búsqueda + chips) se mueve de `app/page.tsx` a `app/biblioteca/page.tsx`, ruta `/biblioteca`, sin cambios de comportamiento.
- `components/Nav.tsx`: se agrega el link "Inicio" → `/`, ajustando `isActive` para que "Biblioteca" solo se marque activo en `/biblioteca` y `/game/*` (ya no en `/`).
- Componentes nuevos en `components/`: `MiniCard.tsx`, `FeatureIcon.tsx`, `FloatingSilhouettes.tsx`, portados de las funciones homónimas en `home.jsx`.
- Botones/CTAs del home enlazan con `next/link`: EXPLORAR JUEGOS / VER TODOS LOS JUEGOS / INSERTAR MONEDA → `/biblioteca`; CREAR CUENTA / EMPEZAR GRATIS → `/login`; mini-cards → `/game/[id]`.
- Datos de ejemplo de "ACTIVIDAD EN VIVO" (ticker de puntuaciones y top jugadores) copiados tal cual del template, como arrays estáticos locales — no leen `localStorage`.
- Preview de juegos usa `GAMES.slice(0, 6)` de `lib/data.ts` (ya existente).
- `useReveal` (IntersectionObserver para animaciones `.reveal`) portado como hook local en `app/page.tsx`.
- Copy en español preservado verbatim del template.

**Out of scope (for future specs):**

- Página About/Contacto (`about.jsx`) y su link "Acerca de" en Nav — spec aparte.
- Conectar "ACTIVIDAD EN VIVO" / "TOP JUGADORES" a datos reales de `localStorage["av_scores"]`.
- Cambios a `/game/[id]`, `/game/[id]/play`, `/login`, `/hall-of-fame`.
- SEO/metadata específico de la ruta Home.
- Tests automatizados.

## Data model

No se introduce persistencia nueva ni tipos en `lib/data.ts`. Solo arrays estáticos locales dentro de `app/page.tsx`, portados literalmente del template:

```ts
// arrays estáticos locales a app/page.tsx (no exportados, no persistidos)
interface TickerRow {
  p: string;   // player handle
  g: string;   // game short name
  s: number;   // score
  t: string;   // "hace X min"
  c: "magenta" | "yellow" | "green" | "cyan";
}

interface TopRow {
  r: number;   // rank
  p: string;   // player handle
  s: number;   // score
}
```

Reutiliza `Game` y `GAMES` de `lib/data.ts` (SPEC 01) sin cambios para la sección de preview de juegos.

## Implementation plan

1. `app/biblioteca/page.tsx` — mover el contenido actual de `app/page.tsx` (Library) tal cual a esta nueva ruta, sin cambios de lógica.
2. `components/FloatingSilhouettes.tsx` — portar el componente SVG decorativo desde `home.jsx` (s1–s8).
3. `components/FeatureIcon.tsx` — portar los íconos pixel-art (GAMEPAD, FREE, TROPHY, ROCKET) desde `home.jsx`.
4. `components/MiniCard.tsx` — portar el mini-card de preview de juegos desde `home.jsx`, usando `next/link` hacia `/game/[id]` en vez de `onClick`+`navigate`.
5. `app/page.tsx` — reemplazar el contenido actual (que se movió en el paso 1) por el nuevo Home: hero, hook `useReveal` local, sección features usando `FeatureIcon`, sección preview usando `MiniCard` + `GAMES.slice(0, 6)`, sección stats, sección actividad en vivo (ticker + top jugadores con datos estáticos), sección precios, CTA final. Todos los botones usan `next/link`/`Link` hacia `/biblioteca` o `/login` según corresponda.
6. `components/Nav.tsx` — agregar link "Inicio" → `/` en desktop y mobile panel; ajustar `isActive("biblioteca")` para que solo matchee `/biblioteca` y `/game/*`, y agregar `isActive("home")` para `/`.
7. Manual pass: recorrer `/`, `/biblioteca`, click en mini-cards, botones CTA, verificar animaciones `.reveal` al hacer scroll, y que Nav resalte "Inicio" vs "Biblioteca" correctamente en cada ruta.

## Acceptance criteria

- [ ] `npm run dev` levanta sin errores de consola en `/` y `/biblioteca`.
- [ ] `/` muestra el hero con silhouettes flotantes, título en 3 líneas, botones "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" en `/` navegan a `/biblioteca`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS" en `/` navegan a `/login`.
- [ ] La sección "JUEGOS DISPONIBLES AHORA" muestra 6 mini-cards con datos de `GAMES`; cada una navega a `/game/[id]` correspondiente.
- [ ] Las secciones de stats, actividad en vivo y precios se ven con los mismos datos de ejemplo del template.
- [ ] Las secciones marcadas `.reveal` aparecen animadas (fade+translate) al hacer scroll hasta ellas.
- [ ] `/biblioteca` muestra el mismo grid, búsqueda y chips que antes tenía `/`, sin regresiones.
- [ ] Nav muestra "Inicio" y "Biblioteca" como links separados; "Inicio" se resalta activo solo en `/`; "Biblioteca" se resalta activo en `/biblioteca` y en `/game/*`.
- [ ] El panel móvil de Nav (hamburguesa) incluye el link "Inicio" y funciona igual que antes.

## Decisions

- **Yes:** mover Biblioteca de `/` a `/biblioteca` en vez de crear Home en otra ruta. Coincide con la estructura de `nav.jsx` de referencia (Inicio y Biblioteca son rutas separadas) y con la decisión ya tomada en la fase de clarificación.
- **Yes:** `MiniCard`, `FeatureIcon`, `FloatingSilhouettes` como componentes propios en `components/`. Mantiene `app/page.tsx` legible y sigue el patrón ya usado por `GameCard.tsx` (SPEC 01).
- **No:** incluir `about.jsx` en esta spec. El folder de referencia trae Home y About juntos, pero son features independientes; About queda para otra spec.
- **Yes:** datos de "ACTIVIDAD EN VIVO" como arrays estáticos, no conectados a `localStorage["av_scores"]`. Igual que el resto del MVP (SPEC 01), que ya usa mock data; conectar datos reales es trabajo aparte.
- **Yes:** hook `useReveal` (IntersectionObserver) definido localmente en `app/page.tsx` en vez de un hook compartido. Solo lo usa esta página por ahora.
- **No:** tocar `/game/[id]`, `/game/[id]/play`, `/login`, `/hall-of-fame`. Fuera de alcance, ya implementados en SPEC 01.

## Risks

| Risk                                                                 | Mitigation                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mover Biblioteca de `/` a `/biblioteca` rompe enlaces/bookmarks existentes a la vista de juegos. | Aceptable en este MVP (sin usuarios reales todavía); documentado en la spec como cambio de ruta intencional. |
| `useReveal` usa `IntersectionObserver`, no disponible en SSR.       | El componente ya es `"use client"` y el efecto corre en `useEffect` (solo cliente), igual que en el template original. |

## What is **not** in this spec

- Página About/Contacto (`about.jsx`) y su link "Acerca de" en Nav.
- Conectar "ACTIVIDAD EN VIVO" / "TOP JUGADORES" a datos reales de `localStorage["av_scores"]`.
- Cambios a `/game/[id]`, `/game/[id]/play`, `/login`, `/hall-of-fame`.
- SEO/metadata específico de la ruta Home.
- Tests automatizados.

Each one of those, if it lands, goes in its own spec.
