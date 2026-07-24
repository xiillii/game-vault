## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

- Instalada en el proyecto
```bash
npx skills@latest add Klerith/fernando-skills
```

- Instalada en el global
``` bash
npx skills add https://github.com/anthropics/skills --skill frontend-design
```

## MCP usadas en este proyecto

- Playwright

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

- Supabase

```bash
claude mcp add --scope project --transport http supabase "http://localhost:54321/mcp"
```

- PostgreSQL

```bash
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres "postgresql://usuario:password@localhost:5432/mibase"
```