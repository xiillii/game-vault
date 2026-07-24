# SPEC 04 — Integración PostgreSQL con Prisma

> **Status:** Implementado
> **Depends on:** SPEC 03
> **Date:** 2026-07-23
> **Objective:** Agregar el cliente Prisma conectado a un servidor PostgreSQL corriendo en un contenedor Docker local, dejando el esquema vacío (sin tablas) y un singleton reutilizable para Server Components/Route Handlers.

## Scope

**In:**

- Instalación de `prisma` (dev dependency) y `@prisma/client`.
- `prisma/schema.prisma` — inicializado con `datasource db` (`provider = "postgresql"`, `url = env("DATABASE_URL")`) y `generator client`, sin ningún `model`.
- `lib/prisma.ts` — singleton de `PrismaClient` vía `globalThis`, patrón estándar para evitar múltiples instancias en hot-reload de Next.js dev.
- `.env.example` — documentar `DATABASE_URL` con formato de ejemplo (`postgresql://usuario:password@localhost:5432/nombre_db`), comentado.

**Out of scope (para otra spec):**

- Cualquier modelo/tabla (`users`, `scores`, etc.) y sus migraciones.
- Auth (login/signup, sesiones, JWT).
- Realtime.
- Edge Functions.
- Verificación/prueba de conexión real al contenedor Docker.
- Uso del cliente Prisma en algún endpoint o página real de la app (esta spec es solo plumbing, no feature visible).
- Tests automatizados.

## Data model

No se introduce ningún modelo de datos nuevo (sin tablas, sin tipos). `prisma/schema.prisma` queda con solo `datasource` y `generator`, sin ningún `model`.

## Implementation plan

1. `npm install prisma --save-dev` y `npm install @prisma/client` — agregar dependencias.
2. `npx prisma init` (o creación manual equivalente) — genera `prisma/schema.prisma` con `datasource db` (`provider = "postgresql"`, `url = env("DATABASE_URL")`) y `generator client { provider = "prisma-client-js" }`, sin ningún `model`.
3. `lib/prisma.ts` — singleton de `PrismaClient`: reutiliza instancia de `globalThis` en desarrollo (evita agotar conexiones por hot-reload), crea instancia nueva en producción.
4. `.env.example` — agregar sección `DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_db` comentada, indicando que apunta al contenedor Docker local.
5. `.gitignore` — confirmar que `.env.local` y (si `prisma init` lo genera) cualquier `.env` con credenciales reales sigan ignorados; añadir entrada si falta.

## Acceptance criteria

- [ ] `prisma` y `@prisma/client` aparecen en `package.json` (`devDependencies` y `dependencies` respectivamente).
- [ ] `prisma/schema.prisma` existe, con `datasource db` apuntando a `env("DATABASE_URL")`, `provider = "postgresql"`, y **sin** ningún bloque `model`.
- [ ] `lib/prisma.ts` exporta un cliente Prisma singleton (reutilizado vía `globalThis` en desarrollo).
- [ ] `.env.example` documenta `DATABASE_URL` con el formato esperado, comentado, sin valores reales.
- [ ] `npm run build` no falla por la nueva configuración de Prisma (el cliente se genera correctamente aunque no haya conexión real durante el build).
- [ ] `.env.local` (si existe con credenciales reales) sigue fuera de git (`.gitignore`).

## Decisions

- **Yes:** Prisma como ORM/cliente, en vez de `pg` crudo o Drizzle. Decisión explícita del usuario.
- **Yes:** PostgreSQL en contenedor Docker local (no Supabase), a pesar de que README mencione MCP de Supabase — esa referencia queda para otro uso, esta spec apunta a Postgres plano. Decisión explícita del usuario.
- **Yes:** `lib/prisma.ts` con patrón singleton vía `globalThis`. Evita el problema conocido de Next.js dev (hot-reload) agotando el pool de conexiones al crear un `PrismaClient` nuevo por reload.
- **No:** crear ningún `model` en `schema.prisma` en esta spec. El esquema queda vacío; tablas se definen cuando exista una feature real que las necesite.
- **No:** verificar la conexión real al contenedor Docker dentro de esta spec. Decisión explícita del usuario — la spec entrega el plumbing, no la prueba.
- **No:** instalar librerías de Auth (`next-auth`, etc.) ni tocar Realtime/Edge Functions. Quedan para specs futuras cuando se implementen esas features.

## Risks

| Risk                                                                                                                                                                   | Mitigation                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx prisma generate` (parte de `npm install`/`postinstall` en muchos setups) puede requerir que `DATABASE_URL` esté definida aunque sea solo para generar el cliente. | Documentar en `.env.example` que `DATABASE_URL` debe existir en `.env.local` antes de correr `npm install`/`prisma generate`, aunque no haya conexión real verificada. |
| Contenedor Docker no corriendo al momento en que alguien use el cliente Prisma en una spec futura.                                                                     | Fuera de alcance de esta spec (sin verificación de conexión); queda documentado como precondición pa quien implemente la próxima feature.                              |
