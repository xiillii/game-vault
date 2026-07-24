# SPEC 05 — Asteroides: primer juego real (canvas)

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-07-23
> **Objective:** Integrar el juego Asteroides (references/started-games/02-asteroids/game.js) como el primer juego real de la biblioteca, portado a un componente canvas de React controlado por la app — puntaje/vidas/nivel/pausa/fin viven en React, el canvas solo renderiza física y gráficos y notifica cambios vía callbacks.

## Scope

**In:**

- Nueva entrada `asteroides` en `lib/data.ts` (`GAMES`): título "ASTEROIDES", categoría `SHOOTER`, reutiliza el estilo visual `cover-rocas` (ya existe en `globals.css`, coincide temáticamente). La entrada `rocas` existente se deja intacta como placeholder para otro juego futuro.
- `components/games/asteroids/engine.ts` — port a TypeScript del motor de `game.js` (clases `Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp`, física, colisiones, spawns, niveles), encapsulado en una clase `AsteroidsEngine` instanciable por `<canvas>` (sin estado a nivel de módulo/globals como el original), con métodos `start()`, `stop()`, `setPaused(paused: boolean)`. Resolución lógica interna: **700×530** (en vez de 800×600 del original); el resto de constantes (velocidades, radios, cooldowns, etc.) se mantiene igual, sin reescalar.
- `components/games/asteroids/AsteroidsGame.tsx` — componente cliente que crea el `<canvas>`, instancia `AsteroidsEngine` en un `useEffect`, conecta los listeners de teclado (`ArrowLeft/Right/Up`, `Space`) mientras el componente está montado y `paused`/`active` lo permiten, y expone las props de `GameEngineProps` (ver Data model) para notificar a React.
- `components/games/registry.ts` — mapa `id -> componente real` (`{ asteroides: AsteroidsGame }`), consultado por la página de juego.
- `app/game/[id]/play/page.tsx` — si el `id` existe en el registro, renderiza el componente real (`key={runId}` para reinicios) dentro de `.crt-screen` en vez del `.game-arena` falso, conectado a los mismos estados React (`score`, `lives`, `level`, `paused`, `over`) que ya existen; si no existe en el registro, sigue mostrando el arena falso sin cambios (resto de juegos dummy no se tocan).
- El canvas se dibuja a resolución lógica 700×530 pero se escala por CSS para llenar `.crt-screen` (que ya es `aspect-ratio: 4/3`), igual que hace hoy `.game-arena` (`position: absolute; inset: 0`).
- Se elimina del canvas el HUD interno de texto (`drawHUD`: score, nivel, corazones, indicador 3x) y el overlay de "GAME OVER" (`drawOverlay`) — esa información vive solo en el HUD de React ya existente (`player-hud`). El resto del renderizado visual (nave, asteroides, balas, partículas, power-ups, parpadeo de invencibilidad) se mantiene igual al original.
- Pausa: controlada por el prop `paused` (mapeado al estado `paused` de React, botón "PAUSA/REANUDAR" ya existente); el motor congela la física mientras `paused` es `true` pero sigue dibujando el último frame; los listeners de teclado no aplican input al juego mientras está en pausa.
- Fin de partida: dos caminos, ambos conducen al modal de "FIN DEL JUEGO" ya existente en `page.tsx`.
  - Natural (vidas a 0): el motor llega a su estado interno `gameover`, deja de actualizar física, y llama a `onGameOver(finalScore)` una sola vez.
  - Manual (botón "FIN"): React pone `active=false`; el motor detiene su loop (`cancelAnimationFrame`) y remueve listeners de inmediato, sin volver a llamar `onGameOver` (React ya conoce el score actual por los `onScoreChange` previos).
- Reinicio ("JUGAR DE NUEVO" en el modal): React incrementa un `runId` que se usa como `key` del componente, forzando un remount completo (nuevo `AsteroidsEngine` desde cero, listeners limpios).

**Out of scope (para otra spec):**

- Cualquier otro de los 7 juegos restantes de la biblioteca (siguen siendo el arena falso).
- Guardado real de partidas/leaderboard en base de datos (sigue usando `localStorage` `av_scores`, sin cambios).
- Sonido/música.
- Soporte táctil/mobile controls (el juego original solo usa teclado; se mantiene así).
- Ajustes de balance de gameplay (velocidades, puntos, power-ups) — se porta el comportamiento tal cual, sin rediseñar la dificultad más allá del cambio de resolución 700×530.
- Cambios de CSS/diseño del `cover-rocas` o de nuevas variantes de cover art.
- Tests automatizados.

## Data model

```ts
// lib/data.ts — nueva entrada en GAMES (mismo tipo Game existente, sin cambios de interfaz)
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "...", // copy corta en español, estilo de las demás entradas
  long: "...",  // copy larga en español, estilo de las demás entradas
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "yellow", // o cyan/green — a definir al escribir el copy, consistente con la paleta
  best: 0,          // sin leaderboard seed real todavía, arranca en 0 igual que un juego nuevo
  plays: "0",
}
```

```ts
// components/games/asteroids/AsteroidsGame.tsx — contrato del componente
export interface GameEngineProps {
  paused: boolean;
  active: boolean; // false => detiene el loop y remueve listeners de inmediato, sin volver a notificar
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export default function AsteroidsGame(props: GameEngineProps): JSX.Element;
```

```ts
// components/games/registry.ts
export const GAME_COMPONENTS: Record<
  string,
  React.ComponentType<GameEngineProps>
>;
```

```ts
// components/games/asteroids/engine.ts — motor, sin JSX, consumido solo por AsteroidsGame.tsx
export class AsteroidsEngine {
  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onScoreChange: (score: number) => void;
      onLivesChange: (lives: number) => void;
      onLevelChange: (level: number) => void;
      onGameOver: (finalScore: number) => void;
    },
  );
  start(): void;
  stop(): void;
  setPaused(paused: boolean): void;
}
```

Conventions:

- `Game.id` y nombres de exports en inglés; copy de UI (`short`/`long`) en español, igual que el resto de `GAMES`.
- El motor (`engine.ts`) no toca el DOM más allá del `<canvas>` que recibe — sin `document.getElementById`, sin listeners de teclado propios (esos viven en `AsteroidsGame.tsx`, que se los pasa o los coordina con el motor).

## Implementation plan

1. `lib/data.ts` — agregar la entrada `asteroides` a `GAMES` (título, copy corta/larga en español, `cat: "SHOOTER"`, `cover: "cover-rocas"`, `best: 0`, `plays: "0"`). Sistema sigue funcional: `/game/asteroides` y `/game/asteroides/play` ya renderizan (con el arena falso, sin cambios de comportamiento aún).
2. `components/games/asteroids/engine.ts` — portar `game.js` a TypeScript dentro de la clase `AsteroidsEngine`: constructor recibe `canvas` + callbacks, encapsula todo el estado que hoy son variables de módulo (`ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `state`, etc.) como propiedades de instancia. W/H pasan a 700×530. Se elimina `drawHUD`/`drawOverlay` y su llamada en `draw()`. Los cambios de `score`/`lives`/`level` disparan los callbacks correspondientes solo cuando el valor cambia. Al llegar a `state === 'gameover'` se llama `onGameOver(score)` una única vez y se detiene el loop.
3. `components/games/asteroids/AsteroidsGame.tsx` — componente `"use client"`: crea el `<canvas width={700} height={530}>` con CSS para llenar `.crt-screen` (`position: absolute; inset: 0; width: 100%; height: 100%`), instancia `AsteroidsEngine` en un `useEffect` (mount), registra los listeners de teclado (`keydown`/`keyup` para `ArrowLeft/Right/Up/Space`) mientras el componente vive, llama `engine.setPaused(paused)` en un efecto dependiente de la prop `paused`, llama `engine.stop()` + remueve listeners cuando `active` pasa a `false` o al desmontar.
4. `components/games/registry.ts` — crear `GAME_COMPONENTS = { asteroides: AsteroidsGame }`.
5. `app/game/[id]/play/page.tsx` — agregar estado `runId` (para forzar remount al reiniciar); resolver `const RealGame = GAME_COMPONENTS[game.id]`; si existe, renderizar `<RealGame key={runId} paused={paused} active={!over} onScoreChange={setScore} onLivesChange={setLives} onLevelChange={setLevel} onGameOver={() => setOver(true)} />` dentro de `.crt-screen` en lugar de `.game-arena`; si no existe, mantener el `.game-arena` falso tal cual está hoy. `endGame` (botón "FIN") sigue siendo `() => setOver(true)` — ahora además desactiva el motor real vía `active={!over}`. `restart` además incrementa `runId`.
6. Verificación manual: abrir `/game/asteroides/play`, controlar la nave con flechas/espacio, confirmar que el HUD de React (arriba) refleja score/vidas/nivel en tiempo real, que "PAUSA" congela el juego, que perder las 3 vidas o pulsar "FIN" abre el modal con el score correcto, que "JUGAR DE NUEVO" reinicia todo desde cero (nave al centro, score 0, vidas 3), y que "SALIR" desmonta sin errores en consola. Confirmar también que el resto de juegos de la biblioteca (`bloque-buster`, `caida`, etc.) siguen mostrando el arena falso sin cambios.

## Acceptance criteria

- [ ] `/` muestra una tarjeta "ASTEROIDES" (categoría SHOOTER) en la biblioteca, separada de "ROCAS", que enlaza a `/game/asteroides`.
- [ ] `/game/asteroides` muestra el detalle del juego (portada `cover-rocas`, copy, leaderboard placeholder) igual que cualquier otro juego.
- [ ] `/game/asteroides/play` renderiza el canvas real dentro de `.crt-screen`, llenando el marco, sin el `.game-arena` falso.
- [ ] Flechas izquierda/derecha rotan la nave, flecha arriba propulsa, espacio dispara — igual que el juego original.
- [ ] El HUD superior de React (PUNTUACIÓN, VIDAS, NIVEL) se actualiza en tiempo real conforme se destruyen asteroides, se pierden vidas y se completan niveles; el canvas no dibuja su propio texto de score/vidas/nivel.
- [ ] Al perder las 3 vidas, el motor se detiene solo y aparece el modal "FIN DEL JUEGO" con el score final correcto, sin necesidad de pulsar "FIN".
- [ ] Pulsar "PAUSA" congela el movimiento de la nave/asteroides/balas (el canvas se queda quieto en el último frame); "REANUDAR" continúa exactamente donde quedó.
- [ ] Pulsar "FIN" durante una partida activa detiene el juego de inmediato y abre el modal con el score acumulado hasta ese momento.
- [ ] Guardar la puntuación en el modal (`GUARDAR PUNTUACIÓN`) sigue escribiendo en `localStorage["av_scores"]` sin cambios respecto al flujo actual.
- [ ] "JUGAR DE NUEVO" reinicia la partida desde cero: nave centrada, score 0, vidas 3, nivel 1, sin residuos del intento anterior (asteroides/balas/partículas viejas).
- [ ] "SALIR" navega de vuelta a `/game/asteroides` sin dejar el loop del canvas corriendo en segundo plano (verificar sin errores en consola tras salir).
- [ ] Otros juegos de la biblioteca (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`) siguen mostrando el arena falso en `/game/[id]/play` sin cambios de comportamiento.
- [ ] `npm run build` y `npm run lint` pasan sin errores nuevos.

## Decisions

- **Yes:** entrada nueva `asteroides` separada de `rocas` en `lib/data.ts`. Decisión explícita del usuario — `rocas` queda como placeholder para otro juego futuro, sin tocarla.
- **Yes:** arquitectura de registro (`components/games/registry.ts`) mapeando `id -> componente real`, en vez de un `if` inline en `play/page.tsx`. Este es "el primer juego" de varios por venir; el registro escala sin refactor cuando se agregue el segundo juego real.
- **Yes:** score/vidas/nivel/pausa/fin viven en React (`play/page.tsx`), el motor solo notifica cambios vía callbacks — igual patrón que los juegos dummy ya existentes (ver `references/started-games/control_juego.png`). El HUD interno del canvas original (`drawHUD`, `drawOverlay`) se elimina para no duplicar esa información.
- **Yes:** callbacks solo en cambio de valor (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`), no un snapshot por frame — evita re-renders de React en cada tick del `requestAnimationFrame`.
- **Yes:** resolución lógica del canvas 700×530 (en vez de 800×600 del original), sin reescalar velocidades/radios. Decisión explícita del usuario, aproximando el tamaño real que ocupa `.crt-screen` en el layout actual.
- **Yes:** reinicio vía remount (`key={runId}`) en vez de una API imperativa (`ref.restart()`). Más simple: cada mount crea un `AsteroidsEngine` limpio, sin estado colgado entre partidas.
- **Yes:** botón "FIN" controla el motor real vía prop `active` (React ya conoce el score corriente por los callbacks previos, no necesita preguntarle nada al motor al finalizar manualmente).
- **Yes:** listeners de teclado activos solo mientras el componente vive y el juego no está en pausa/inactivo — se registran en el mount, se remueven en el unmount o al desactivarse, evitando fugas de listeners entre partidas o interferencia con otras páginas.
- **No:** rediseñar el balance de gameplay (velocidades, spawn rate, puntos, power-ups). Se porta tal cual, solo cambia la resolución del área de juego.
- **No:** sonido, controles táctiles, ni guardado real en base de datos en esta spec. Quedan para specs futuras.

## Risks

| Risk                                                                                                                                                                          | Mitigation                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React StrictMode (dev) invoca `useEffect` dos veces al montar, lo que podría crear dos `AsteroidsEngine` corriendo en paralelo sobre el mismo canvas.                         | La función de cleanup del `useEffect` debe llamar `engine.stop()` y remover listeners de forma completa e idempotente, de modo que el segundo mount arranque limpio.                                      |
| Las teclas `ArrowUp`/`ArrowDown`/`Space` en `window` también controlan el scroll del navegador, lo que puede mover la página mientras se juega.                               | Los listeners del juego llaman `e.preventDefault()` en `keydown` para esas teclas mientras el componente está activo (no en pausa/inactivo), igual que suelen hacer los juegos de canvas en el navegador. |
| Al escalar el canvas 700×530 vía CSS para llenar `.crt-screen`, si el contenedor no respeta exactamente 4:3 en algún breakpoint, la imagen podría verse ligeramente estirada. | `.crt-screen` ya fuerza `aspect-ratio: 4/3` en CSS existente; no se requiere cambio, pero se verifica visualmente en el paso de verificación manual (punto 6 del plan).                                   |
