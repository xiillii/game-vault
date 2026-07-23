# SPEC 03 — About page + envío de contacto

> **Status:** Implementado
> **Depends on:** SPEC 02
> **Date:** 2026-07-23
> **Objective:** Portar la página About/Contacto (`references/templates/home-about/about.jsx`) a `app/about/page.tsx` con formulario funcional que envía correos vía Resend o Gmail API según configuración.

## Scope

**In:**

- Nueva página `app/about/page.tsx` (ruta `/about`), portada de `about.jsx`: hero "ACERCA DE ARCADE VAULT" con misión + highlight row (HEART/BROWSER/PLANT), divider decorativo animado, sección de contacto con formulario (nombre, correo, mensaje).
- `components/Nav.tsx`: se agrega el link "Acerca de" → `/about` en desktop y panel móvil, con `isActive("about")` que solo matchee `/about`.
- `lib/useReveal.ts`: se extrae el hook `useReveal` (IntersectionObserver para `.reveal`) actualmente inline en `app/page.tsx`, y se reutiliza en `app/page.tsx` (Home) y `app/about/page.tsx`.
- Migración de estilos faltantes a `app/globals.css`: `.about*`, `.highlight*`, `.hl-icon`/`.hl-text`, `.contact*`, `.terminal-success`/`.term-*`, `@keyframes shake`.
- Formulario de contacto funcional: POST a `app/api/contact/route.ts`, con estados `idle` → `sending` (botón "ENVIANDO...", deshabilitado) → `success` (terminal-success del template) o `error` (mensaje de error con el mismo estilo terminal, en rojo/magenta).
- Validación client-side (ya existe: shake si hay campos vacíos) + validación server-side en el route handler (campos presentes, formato de email básico).
- Campo honeypot oculto adicional en el formulario (bots que lo rellenan → la request se descarta silenciosamente con respuesta 200 "success" simulada, sin llamar al proveedor de correo).
- `app/api/contact/route.ts`: lee `EMAIL_PROVIDER` (`resend` | `gmail`) y despacha al proveedor correspondiente; el correo se envía a `CONTACT_TO_EMAIL`.
- Adaptador `lib/email/resend.ts`: envío vía SDK `resend`, usa `RESEND_API_KEY`.
- Adaptador `lib/email/gmail.ts`: envío vía Gmail API (`googleapis`) con OAuth2 + refresh token, usa `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`.
- `.env.example` documentando todas las variables anteriores con comentarios sobre cuáles aplican a cada proveedor.
- Instalación de dependencias `resend` y `googleapis`.

**Out of scope (para otra spec):**

- Panel de administración / bandeja para ver mensajes recibidos.
- Persistencia de mensajes enviados (ni en `localStorage` ni en base de datos) — el correo es el único registro.
- Rate limiting más allá del honeypot (ej. CAPTCHA, límite por IP).
- Internacionalización del formulario (queda en español, igual que el resto del sitio).
- Tests automatizados.

## Data model

No se introduce persistencia nueva (sin `localStorage`, sin base de datos). Solo tipos/contratos de la API de contacto:

```ts
// app/api/contact/route.ts — request body
interface ContactRequestBody {
  name: string;
  email: string;
  msg: string;
  hp?: string; // honeypot — si viene con contenido, se descarta silenciosamente
}

// lib/email/*.ts — contrato común de los adaptadores
interface SendContactEmailInput {
  name: string;
  email: string;
  msg: string;
}

interface SendContactEmailResult {
  ok: boolean;
  error?: string;
}
```

```ts
// lib/email/index.ts — selector por configuración
type EmailProvider = "resend" | "gmail";
// EMAIL_PROVIDER en process.env determina qué adaptador se usa
```

Variables de entorno (`.env.example`):

```
EMAIL_PROVIDER=resend        # "resend" | "gmail"
CONTACT_TO_EMAIL=team@arcadevault.example

# Resend (si EMAIL_PROVIDER=resend)
RESEND_API_KEY=

# Gmail API (si EMAIL_PROVIDER=gmail) — OAuth2 con refresh token
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

## Implementation plan

1. `lib/useReveal.ts` — extraer el hook `useReveal` (IntersectionObserver sobre `.reveal`) desde `app/page.tsx` a un módulo compartido; actualizar `app/page.tsx` para importarlo en vez de definirlo inline.
2. `app/globals.css` — migrar los estilos faltantes desde `references/templates/home-about/styles.css`: `.about*`, `.highlight-row`/`.highlight`/`.hl-icon`/`.hl-text`, `.about-divider`/`.div-bar`/`.div-pixels`, `.contact*`, `.terminal-success`/`.term-*`, `@keyframes shake`.
3. `.env.example` — crear con `EMAIL_PROVIDER`, `CONTACT_TO_EMAIL`, `RESEND_API_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`, cada uno comentado.
4. `npm install resend googleapis` — agregar dependencias de envío de correo.
5. `lib/email/resend.ts` — adaptador que envía el correo usando el SDK `resend` y `RESEND_API_KEY`/`CONTACT_TO_EMAIL`.
6. `lib/email/gmail.ts` — adaptador que envía el correo vía Gmail API (`googleapis`), autenticando con `OAuth2Client` + `GMAIL_REFRESH_TOKEN`, enviando desde `GMAIL_SENDER_EMAIL` a `CONTACT_TO_EMAIL`.
7. `lib/email/index.ts` — función `sendContactEmail(input)` que lee `EMAIL_PROVIDER` y delega al adaptador correspondiente, devolviendo `SendContactEmailResult`.
8. `app/api/contact/route.ts` — `POST` handler: valida `name`/`email`/`msg` (presencia + formato básico de email), revisa el campo honeypot (si viene relleno, responde `200 {ok:true}` sin llamar a `sendContactEmail`), en caso normal llama a `sendContactEmail` y responde `200 {ok:true}` o `500 {ok:false, error}`.
9. `components/HighlightIcon.tsx` — portar los íconos pixel-art (HEART, BROWSER, PLANT) desde `about.jsx`.
10. `app/about/page.tsx` — portar el hero, highlight row (usando `HighlightIcon`), divider, y formulario de contacto desde `about.jsx`; usar `useReveal` del paso 1; conectar el submit a `fetch("/api/contact", {method:"POST", ...})` con estados `idle`/`sending`/`success`/`error` (botón "ENVIANDO..." deshabilitado durante `sending`; `terminal-success` en `success`; mensaje de error con el mismo estilo terminal en `error`); incluir el campo honeypot oculto (`display:none`, `tabIndex={-1}`, `autoComplete="off"`).
11. `components/Nav.tsx` — agregar link "Acerca de" → `/about` en desktop y panel móvil; agregar `isActive("about")` que matchee solo `/about`.
12. Manual pass: navegar a `/about`, verificar animaciones `.reveal`, enviar el formulario con datos válidos (verificar estado `sending` → `success`), enviar con campos vacíos (verificar shake), forzar un error de configuración (ej. `EMAIL_PROVIDER` inválido) y verificar el estado `error`, confirmar que Nav resalta "Acerca de" solo en `/about`.

## Acceptance criteria

- [ ] `npm run dev` levanta sin errores de consola en `/about`.
- [ ] `/about` muestra el hero "ACERCA DE ARCADE VAULT" con el texto de misión y el highlight row (HEART/BROWSER/PLANT) con los mismos colores/copy del template.
- [ ] El divider decorativo entre About y Contacto se anima al hacer scroll (`.reveal`).
- [ ] La sección de contacto muestra el formulario (nombre, correo, mensaje) y los 3 "tips" (respuesta 24-48h, sugerencias bienvenidas, sin spam).
- [ ] Enviar el formulario con algún campo vacío dispara el efecto `shake` y no hace ningún POST.
- [ ] Enviar el formulario con datos válidos deshabilita el botón y muestra "ENVIANDO..." mientras espera la respuesta de `/api/contact`.
- [ ] Con `EMAIL_PROVIDER=resend` y `RESEND_API_KEY` válida, el envío exitoso muestra el `terminal-success` con el nombre del remitente, y llega un correo real a `CONTACT_TO_EMAIL`.
- [ ] Con `EMAIL_PROVIDER=gmail` y credenciales OAuth2 válidas, el envío exitoso muestra el `terminal-success` y llega un correo real a `CONTACT_TO_EMAIL` desde `GMAIL_SENDER_EMAIL`.
- [ ] Si el proveedor configurado falla (credenciales inválidas o `EMAIL_PROVIDER` no reconocido), el formulario muestra un estado de error visible (estilo terminal) en vez de quedarse en "ENVIANDO..." indefinidamente.
- [ ] Rellenar el campo honeypot y enviar el formulario no dispara ningún envío de correo real, pero la UI muestra igualmente el estado de éxito.
- [ ] `.env.example` existe en la raíz del repo con las 7 variables documentadas.
- [ ] Nav muestra "Acerca de" como link en desktop y en el panel móvil; se resalta activo solo en `/about`.
- [ ] `/` y `/biblioteca` siguen funcionando sin regresiones tras extraer `useReveal` a `lib/useReveal.ts`.

## Decisions

- **Yes:** extraer `useReveal` a `lib/useReveal.ts` ahora que se usa en 2 páginas (Home y About), en vez de duplicar el `useEffect` con `IntersectionObserver`. Elimina duplicación real, no es abstracción prematura.
- **Yes:** ruta `/about` (inglés) en vez de `/acerca-de`, aunque el resto de rutas del sitio están en español (`/biblioteca`, `/hall-of-fame`). Decisión explícita del usuario.
- **Yes:** el envío de correo vive en un Route Handler (`app/api/contact/route.ts`) y no se llama a Resend/Gmail directamente desde el cliente. Las API keys y refresh tokens no pueden exponerse al navegador.
- **Yes:** selector de proveedor por variable de entorno (`EMAIL_PROVIDER`) con dos adaptadores intercambiables (`lib/email/resend.ts`, `lib/email/gmail.ts`) detrás de una función común `sendContactEmail`. Permite cambiar de proveedor sin tocar el route handler ni el formulario.
- **Yes:** Gmail API con OAuth2 + refresh token (no domain-wide delegation). Aplica a cuentas Gmail normales, no requiere Google Workspace.
- **Yes:** validación duplicada (cliente + servidor). El cliente da feedback inmediato (shake); el servidor no puede confiar en eso porque el endpoint es alcanzable directamente.
- **Yes:** honeypot simple como única protección anti-spam en esta spec. Suficiente para bots básicos sin agregar dependencias de CAPTCHA; rate limiting más robusto queda fuera de alcance.
- **No:** persistir los mensajes enviados (ni `localStorage` ni base de datos). El correo es el único registro; agregar un panel de administración es una feature aparte.
- **No:** internacionalizar el formulario. Sigue en español, consistente con el resto del sitio.

## Risks

| Risk | Mitigation |
|---|---|
| Credenciales de Gmail OAuth2 (refresh token) expiran o se revocan, o `RESEND_API_KEY` es inválida. | El route handler captura el error del adaptador y responde `500`; la UI muestra un estado de error genérico en vez de fallar silenciosamente. |
| Faltan variables de entorno en producción (`.env.local` no configurado). | `.env.example` documenta las 7 variables requeridas; el adaptador seleccionado debe fallar con un mensaje claro si faltan las suyas, en vez de un error genérico. |
| El honeypot no detiene bots más sofisticados (headless browsers que sí rellenan el DOM real). | Aceptado como límite conocido en esta spec; rate limiting/CAPTCHA queda fuera de alcance y se documenta como riesgo residual. |
| Migrar `useReveal` a `lib/useReveal.ts` rompe las animaciones ya funcionando en Home. | El manual pass (paso 12 del plan) incluye verificar explícitamente que `/` sigue animando `.reveal` igual que antes. |

## What is **not** in this spec

- Panel de administración / bandeja para ver mensajes recibidos.
- Persistencia de mensajes enviados.
- Rate limiting más allá del honeypot.
- Internacionalización del formulario.
- Tests automatizados.

Each one of those, if it lands, goes in its own spec.
