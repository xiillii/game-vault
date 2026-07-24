# SPEC 06 — Leaderboards, Salón de la Fama y catálogo de juegos persistidos

> **Status:** Draft
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-07-23
> **Objective:** Persistir el catálogo de juegos y las puntuaciones en PostgreSQL vía Prisma (reemplazando `lib/data.ts` hardcodeado y `localStorage["av_scores"]`), exponer el Top N por juego, el Top global del Salón de la Fama y las secciones de la home conectadas a esos mismos datos, todo leído en tiempo de solicitud (sin caché) desde Route Handlers.

## Scope

**In:**

- `prisma/schema.prisma` — dos modelos nuevos:
  - `Game` (id, title, short, long, cat, cover, color) — reemplaza el array `GAMES` de `lib/data.ts`. Sin `best`/`plays` como columnas (se calculan en vivo).
  - `Score` (id, gameId → Game, nickname, score, createdAt) — reemplaza `localStorage["av_scores"]`.
- Migración inicial (`npx prisma migrate dev --name init_games_scores`) que crea ambas tablas contra la `DATABASE_URL` ya configurada en `.env`.
- `prisma/seed.ts` — upsert de un único registro en `Game`: Asteroides (mismos datos de copy que hoy tiene `asteroides` en `lib/data.ts`), configurado en `package.json` (`prisma.seed`) para correr con `npx prisma db seed`. Ningún otro juego se siembra.
- `lib/data.ts` — se elimina el array `GAMES` hardcodeado y las entradas de los 8 juegos ficticios/no reales. Se elimina también `seededScores` (ya no se necesita, el Top N sale de la DB). Los tipos (`Game`, `ScoreRow` o equivalentes) se conservan/ajustan según lo que necesiten los Route Handlers y componentes.
- Route Handlers nuevos (todos `GET` no cacheados salvo se indique, leyendo Prisma en cada request):
  - `GET /api/games` — lista de juegos con `best` (MAX score) y `plays` (COUNT scores) calculados por juego.
  - `GET /api/games/[id]` — detalle de un juego + su Top 12 (mejor score por nickname, `MAX(score)` agrupado por `nickname`, ordenado desc).
  - `POST /api/scores` — guarda una partida: `{ gameId, nickname, score }`. Valida que `gameId` exista (404 si no) y que `nickname` no esté vacío tras `trim()` (400 si no cumple longitud mínima). No crea juegos nuevos.
  - `GET /api/hall-of-fame` — Top 12 global histórico: todos los scores individuales de todos los juegos mezclados, ordenados desc (sin agrupar por juego).
  - `GET /api/stats/home` — agregados para la home: `gamesCount` (COUNT Game), `playsCount` (COUNT Score total), `recentScores` (últimos 8 Score de cualquier juego/nickname, con nombre de juego, para el TICKER), `topToday` (Top 6 de scores individuales creados hoy, mezclados entre juegos, para TOP_PLAYERS).
- Páginas conectadas a estos endpoints vía `fetch()` en `useEffect` (siguen siendo `"use client"`, cambio mínimo a la estructura existente):
  - `app/page.tsx` — sección GAMES PREVIEW (`GET /api/games`, hasta 6), STATS (`gamesCount`/`playsCount` de `GET /api/stats/home`, "GLOBAL RANKING" queda como copy fijo), ACTIVIDAD EN VIVO (`recentScores` y `topToday` de `GET /api/stats/home`).
  - `app/game/[id]/page.tsx` — detalle + leaderboard (`GET /api/games/[id]`), reemplaza `seededScores`. `game.best`/`game.plays` del stat-strip vienen del mismo response.
  - `app/game/[id]/play/page.tsx` — `saveScore` pasa de escribir en `localStorage["av_scores"]` a `POST /api/scores`.
  - `app/hall-of-fame/page.tsx` — las tabs por juego consultan `GET /api/games/[id]` (Top 12 de ese juego); el podio/tabla usa el Top global (`GET /api/hall-of-fame`) en vez de `seededScores`. Estructura exacta de tabs vs. podio se define en el plan de implementación.
- Timestamps relativos ("hace 2 min") del TICKER se calculan en el cliente a partir de `createdAt` recibido del endpoint.
- Estado vacío: cuando un Top N (por juego, global o "hoy") no tiene filas, se muestra un mensaje corto ("AÚN SIN PUNTUACIONES" / "AÚN SIN PUNTUACIONES HOY") en el lugar de la tabla/podio, sin romper el layout existente.

**Out of scope (para otra spec):**

- Administración del catálogo de juegos (crear/editar/eliminar `Game` desde la UI). El catálogo solo se puebla vía seed.
- Autenticación real (login, sesiones). El nickname sigue viniendo de `localStorage["av_user"]` o el input "TUS INICIALES" del modal, sin cuenta de usuario.
- Cualquier juego adicional a Asteroides (los 8 juegos ficticios eliminados de `lib/data.ts` no vuelven en esta spec).
- Migrar `FEATURES` y la sección `PRICING` de la home (contenido de marketing sin relación a datos de juegos/scores).
- Server Components / Server Actions (se decidió explícitamente mantener el patrón `"use client"` + `fetch` en Route Handlers).
- Revalidación en segundo plano, polling, WebSockets o cualquier actualización en tiempo real de los leaderboards — la actualización solo ocurre al entrar a la página o refrescar el navegador.
- Paginación de leaderboards más allá del Top 12 / Top 6.
- Borrado o edición de scores ya guardados.
- Tests automatizados.

## Data model

```prisma
// prisma/schema.prisma — se agregan estos modelos (datasource/generator ya existentes de SPEC 04, sin cambios)

model Game {
  id     String  @id
  title  String
  short  String
  long   String
  cat    String  // "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS" (mismos valores que hoy en lib/data.ts)
  cover  String  // clase CSS, e.g. "cover-rocas"
  color  String  // "cyan" | "magenta" | "yellow" | "green"
  scores Score[]
}

model Score {
  id        String   @id @default(cuid())
  gameId    String
  game      Game     @relation(fields: [gameId], references: [id])
  nickname  String
  score     Int
  createdAt DateTime @default(now())

  @@index([gameId, score])
  @@index([createdAt])
}
```

```ts
// prisma/seed.ts — único registro sembrado, vía upsert por id (idempotente)
await prisma.game.upsert({
  where: { id: "asteroides" },
  update: {},
  create: {
    id: "asteroides",
    title: "ASTEROIDES",
    short: "Sobrevive al campo de rocas a la deriva.",
    long: "Pilota tu nave triangular entre esquirlas de roca que giran sin control. Rota, propulsa y dispara para fragmentarlas antes de que te embistan. Cada nivel suma más rocas y menos espacio para respirar.",
    cat: "SHOOTER",
    cover: "cover-rocas",
    color: "yellow",
  },
});
```

```ts
// Contratos de respuesta de los Route Handlers (JSON, sin tipos compartidos nuevos más allá de estas formas)

// GET /api/games
type GameListItem = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: string;
  best: number; // MAX(score) del juego, 0 si no hay scores
  plays: number; // COUNT(*) de Score del juego
};

// GET /api/games/[id]
type GameDetail = GameListItem & {
  leaderboard: {
    rank: number;
    nickname: string;
    score: number;
    createdAt: string;
  }[]; // Top 12, mejor score por nickname
};

// POST /api/scores — body
type ScoreInput = { gameId: string; nickname: string; score: number };
// respuesta: 201 { id, gameId, nickname, score, createdAt } | 400 (nickname vacío) | 404 (gameId no existe)

// GET /api/hall-of-fame
type HallOfFameRow = {
  rank: number;
  nickname: string;
  gameId: string;
  gameTitle: string;
  score: number;
  createdAt: string;
};
// respuesta: HallOfFameRow[] — Top 12 global, scores individuales sin agrupar

// GET /api/stats/home
type HomeStats = {
  gamesCount: number;
  playsCount: number;
  recentScores: {
    nickname: string;
    gameId: string;
    gameTitle: string;
    score: number;
    createdAt: string;
  }[]; // últimos 8
  topToday: { rank: number; nickname: string; score: number }[]; // Top 6 de hoy, scores individuales mezclados
};
```

Convenciones:

- `Game.id` sigue siendo el slug legible usado hoy en rutas (`asteroides`), no un `cuid()` — es la clave natural también usada por `/game/[id]`.
- `Score.id` usa `cuid()` (default de Prisma), no hay necesidad de slug legible para un score individual.
- El "mejor score por nickname" (leaderboard de juego) se calcula agrupando en la query de Prisma (`groupBy` + `max`), no se materializa en una tabla aparte.
- El Top global (`/api/hall-of-fame`, `topToday`) no agrupa por nickname — son los scores individuales tal cual, mezclados entre juegos, ordenados desc (según lo decidido en Scope).

## Implementation plan

1. **Schema + migración.** Agregar `model Game` y `model Score` a `prisma/schema.prisma` (según Data model). Correr `npx prisma migrate dev --name init_games_scores` contra la `DATABASE_URL` de `.env`. Sistema sigue funcional: la app todavía usa `lib/data.ts` hardcodeado, solo se agregaron tablas vacías.

2. **Seed.** Crear `prisma/seed.ts` con el upsert de Asteroides (Data model). Agregar bloque `"prisma": { "seed": "..." }` en `package.json` (con el runner que corresponda, ej. `tsx prisma/seed.ts`). Correr `npx prisma db seed` y confirmar con una query manual que el registro existe. Sistema sigue funcional, sin cambios de código de app todavía.

3. **Route Handlers de lectura.** Crear `app/api/games/route.ts` (GET, lista con `best`/`plays`) y `app/api/games/[id]/route.ts` (GET, detalle + Top 12 por nickname). Ambos leen de Prisma, sin caché. Verificables directamente por URL (`/api/games`, `/api/games/asteroides`) antes de tocar ninguna página.

4. **Route Handler de escritura.** Crear `app/api/scores/route.ts` (POST), con validación de `gameId` existente y `nickname` no vacío tras `trim()`. Verificable con una petición manual (curl/Postman) que inserta un score y aparece luego en `/api/games/asteroides`.

5. **Route Handlers de agregados.** Crear `app/api/hall-of-fame/route.ts` (GET, Top 12 global histórico) y `app/api/stats/home/route.ts` (GET, `gamesCount`/`playsCount`/`recentScores`/`topToday`). Verificables por URL igual que el paso 3.

6. **Limpieza de `lib/data.ts`.** Eliminar el array `GAMES` hardcodeado (los 8 juegos ficticios + la entrada duplicada de Asteroides), `seededScores` y `PLAYERS` (ya no usado si solo alimentaba `seededScores`). Conservar/ajustar el tipo `Game` y agregar los tipos de respuesta de los endpoints (Data model) donde se vayan a consumir. En este punto la app puede quedar momentáneamente rota (páginas que importan `GAMES`) — es intencional, se resuelve en los pasos siguientes del mismo plan.

7. **Conectar `app/page.tsx`.** Sustituir `GAMES.slice(0,6)` por un `fetch("/api/games")` en `useEffect` (Top 6) para GAMES PREVIEW; `STATS` consume `gamesCount`/`playsCount` de `GET /api/stats/home` (columna "GLOBAL RANKING" queda como copy fijo); `TICKER` y `TOP_PLAYERS` consumen `recentScores`/`topToday` del mismo endpoint, con estado vacío ("AÚN SIN PUNTUACIONES HOY") cuando `topToday` viene vacío. Sistema funcional: home ya no depende de `lib/data.ts` para estas secciones.

8. **Conectar `app/game/[id]/page.tsx`.** Sustituir `GAMES.find(...)` + `seededScores(...)` por `fetch(`/api/games/${id}`)`; si el juego no existe (404), mantener el `return null` actual. `game.best`/`game.plays` y el leaderboard lateral vienen del mismo response, con estado vacío en el leaderboard si no hay scores. Sistema funcional: `/game/asteroides` ya lee de la DB.

9. **Conectar `app/game/[id]/play/page.tsx`.** Sustituir la búsqueda `GAMES.find(...)` por el mismo `fetch` del paso 8 (o reutilizar), manteniendo `GAME_COMPONENTS[game.id]` sin cambios. `saveScore` pasa de escribir `localStorage["av_scores"]` a `POST /api/scores` con `{ gameId: game.id, nickname: name, score }`; `setSaved(true)` solo tras respuesta exitosa (manejar el caso de error de red/validación dejando el botón disponible para reintentar). Sistema funcional: partidas de Asteroides ya se guardan en PostgreSQL.

10. **Conectar `app/hall-of-fame/page.tsx`.** Las tabs (`GAMES.map`) pasan a alimentarse de `fetch("/api/games")` (lista de juegos para las tabs); al seleccionar una tab, sus filas vienen de `fetch(`/api/games/${tab}`)` (Top 12 de ese juego, con estado vacío). El bloque "TU MEJOR MARCA" (hoy `youRank`/`youScore` aleatorios) **se deja tal cual está, sin conectar a datos reales** — requiere identificar al jugador actual sin auth, que queda fuera de alcance de esta spec y se retoma en un futuro SPEC. El podio superior usa el Top global (`GET /api/hall-of-fame`) en vez de `seededScores`, con estado vacío si no hay ningún score todavía.

11. **Verificación manual.** Con la DB recién migrada/sembrada y sin ningún score guardado: confirmar estados vacíos en home, `/game/asteroides`, `/game/asteroides/play` (modal) y `/hall-of-fame`. Jugar una partida de Asteroides, guardar el score con un nickname, y confirmar que aparece en: leaderboard de `/game/asteroides`, Top global de `/hall-of-fame`, `recentScores`/`topToday` de la home (tras recargar). Confirmar que `npm run build` y `npm run lint` pasan sin errores nuevos.

## Acceptance criteria

- [ ] `prisma/schema.prisma` define `model Game` y `model Score` (según Data model), con la relación `Score.gameId → Game.id`.
- [ ] Existe una migración (`prisma/migrations/...init_games_scores`) aplicada contra la `DATABASE_URL` de `.env`, creando ambas tablas.
- [ ] `npx prisma db seed` inserta exactamente un `Game` (`id: "asteroides"`) de forma idempotente (correrlo dos veces no duplica ni falla).
- [ ] `GET /api/games` responde con el/los juego(s) sembrados, incluyendo `best` y `plays` calculados (0 si no hay scores).
- [ ] `GET /api/games/asteroides` responde con el detalle del juego y un `leaderboard` (vacío si no hay scores, máx. 12 filas con el mejor score por nickname si los hay).
- [ ] `POST /api/scores` con un `gameId` válido y `nickname` no vacío crea un `Score` y responde 201; con `gameId` inexistente responde 404; con `nickname` vacío/solo espacios responde 400.
- [ ] `GET /api/hall-of-fame` responde con el Top 12 global (scores individuales mezclados entre juegos, sin agrupar por nickname).
- [ ] `GET /api/stats/home` responde con `gamesCount`, `playsCount`, `recentScores` (máx. 8) y `topToday` (máx. 6, solo scores de la fecha actual).
- [ ] `lib/data.ts` ya no exporta `GAMES` (array hardcodeado) ni `seededScores`.
- [ ] `/` (home) muestra en GAMES PREVIEW, STATS, y ACTIVIDAD EN VIVO (TICKER + TOP JUGADORES · HOY) datos provenientes de los endpoints anteriores, no de constantes locales.
- [ ] `/game/asteroides` muestra `best`/`plays`/leaderboard provenientes de `GET /api/games/asteroides`.
- [ ] Jugar una partida en `/game/asteroides/play`, guardar el score con un nickname, y confirmar (recargando la página) que ese score aparece en el leaderboard de `/game/asteroides`, en `/hall-of-fame` y en `recentScores`/`topToday` de la home.
- [ ] `/hall-of-fame` muestra tabs generadas desde `GET /api/games`, filas por tab desde `GET /api/games/[id]`, y el podio/tabla superior desde `GET /api/hall-of-fame`; el bloque "TU MEJOR MARCA" sigue funcionando igual que hoy (aleatorio, sin cambios).
- [ ] Con la DB recién sembrada (sin scores), todos los leaderboards/podios afectados muestran el mensaje de estado vacío correspondiente, sin romper el layout.
- [ ] Ninguna de las páginas/actualizaciones anteriores hace polling ni se actualiza sin recargar/re-entrar a la página (confirmado dejando una pestaña abierta mientras se guarda un score desde otra).
- [ ] `npm run build` y `npm run lint` pasan sin errores nuevos.

## Decisions

- **Yes:** eliminar por completo `GAMES` hardcodeado y sembrar solo Asteroides — el catálogo real vive únicamente en la tabla `Game`. Decisión explícita del usuario; los otros 8 juegos ficticios desaparecen de la app hasta que se agreguen a la DB en el futuro (fuera de alcance la administración del catálogo).
- **Yes:** Top N por juego = mejor score por nickname (`MAX(score)` agrupado), no todas las partidas individuales. Evita que un jugador que reintenta muchas veces acapare el leaderboard de su propio juego.
- **Yes:** Top global del Salón de la Fama = mezcla de todos los scores individuales (sin agrupar por nickname ni normalizar entre juegos), a diferencia del Top N por juego. Decisión explícita del usuario, aceptando que un juego con puntajes naturalmente altos puede dominar el ranking global.
- **Yes:** N = 12 en todos los Top N por juego y en el Top global histórico; N = 6 para `topToday` (home) y para el recorte de `GET /api/games` en el GAMES PREVIEW de la home.
- **Yes:** `best`/`plays` de cada juego se calculan en vivo con queries Prisma (`MAX`/`COUNT`) en cada request, no se cachean como columnas en `Game`. Simplicidad: con el volumen esperado no hay necesidad de mantener contadores sincronizados.
- **Yes:** acceso a datos vía Route Handlers (`app/api/.../route.ts`) + `fetch()` desde componentes `"use client"` existentes, en vez de Server Components o Server Actions. Decisión explícita del usuario; cambio mínimo sobre la estructura de páginas ya existente (SPEC 05).
- **Yes:** los `GET` Route Handlers son dinámicos por defecto (sin `export const dynamic = "force-static"` ni `use cache`), confirmado en la doc vendored (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) — encaja directamente con el requisito de que los Top N solo se actualicen al entrar a la página o recargar.
- **Yes:** nickname se guarda con `trim()` + validación de longitud mínima en el backend (`POST /api/scores`), sin unicidad ni restricciones adicionales — sigue viniendo del mismo input de 10 caracteres en mayúsculas que ya existe en el modal de fin de juego.
- **Yes:** `POST /api/scores` falla (404) si `gameId` no existe en la tabla `Game`; no crea juegos on-the-fly. Coherente con "no implementar administración del catálogo".
- **Yes:** conectar también `STATS`, `TICKER` y `TOP_PLAYERS` de la home a datos reales (no solo GAMES PREVIEW), ampliando el alcance inicial a pedido explícito del usuario. `TOP_PLAYERS` (renombrado en UI a "TOP JUGADORES · HOY") se filtra solo a scores del día actual, no histórico.
- **No:** tocar `FEATURES` ni la sección `PRICING` de la home — son copy de marketing sin relación a datos de juegos/scores.
- **No:** implementar paginación, revalidación en tiempo real (polling/WebSockets), edición/borrado de scores, ni autenticación real. Quedan para specs futuras.
- **No:** conectar el bloque "TU MEJOR MARCA" de `/hall-of-fame` a datos reales en esta spec — requiere identificar al jugador actual sin sistema de auth; se deja aleatorio como hoy y se retoma explícitamente en un SPEC futuro (decisión explícita del usuario, para no perderlo de vista).

## Risks

| Risk                                                                                                                                                                        | Mitigation                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El paso 6 del plan (eliminar `GAMES` de `lib/data.ts`) deja momentáneamente rotas las páginas que aún la importan, hasta completar los pasos 7-10.                          | Es intencional y está documentado en el plan; se ejecuta en una sola sesión de trabajo, no se hace commit/deploy de un estado intermedio roto.                                                   |
| `npx prisma migrate dev` requiere que el servidor PostgreSQL de `DATABASE_URL` esté corriendo y accesible al momento de ejecutar el comando.                                | Precondición ya cubierta por SPEC 04 (`.env` con la cadena de conexión correcta); si el contenedor/servidor no está arriba, el comando falla con un error claro antes de tocar código de la app. |
| El Top global (mezcla de scores individuales sin normalizar) puede parecer "injusto" si un solo juego domina todo el Salón de la Fama al agregarse más juegos en el futuro. | Aceptado explícitamente como decisión de esta spec; si se vuelve un problema real con más juegos, se revisita en un SPEC futuro (posible normalización o Top-por-juego-y-global combinado).      |
| `topToday` y `recentScores` dependen de la zona horaria del servidor donde corre Postgres/Next.js para definir "hoy".                                                       | Fuera de alcance de esta spec resolver zonas horarias multi-región; se asume una sola zona horaria (la del servidor) igual que el resto de la app hoy.                                           |
