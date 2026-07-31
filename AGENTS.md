# AGENTS.md — GalScout (ojeo)

Guía de referencia rápida para agentes que trabajen en este repo. Objetivo: evitar
re-explorar el proyecto desde cero en cada tarea. Léelo antes de hacer Glob/Grep
exploratorios genéricos — la mayoría de las respuestas ya están aquí.

## Qué es esto

App de scouting de fútbol ("GalScout") para un club gallego. Gestión de jugadores
ojeados, informes/observaciones, comparativas, historial por equipo y un modo de
"ojeo de partido en directo" (captura de acciones sobre el campo en tiempo real).
Un único usuario/administrador por ahora (login simple con Supabase Auth, sin roles).

## Stack y comandos

- React 19 + TypeScript + Vite 8, sin React Compiler.
- Enrutado con `react-router-dom` v7 (`BrowserRouter` en `main.tsx`).
- Backend: Supabase (Postgres + Auth + RLS). Cliente en [src/lib/supabase.ts](src/lib/supabase.ts).
- UI: Bootstrap 5 (clases utilitarias `d-flex`, `card`, etc.) + CSS propio en
  [src/App.css](src/App.css) (~2400 líneas) y variables de tema en [src/index.css](src/index.css).
- Sin librería de iconos: cada icono es un componente SVG suelto en `src/components/`
  (ver sección Iconos).
- Sin tests configurados (no hay Jest/Vitest). `npm run lint` usa ESLint flat config
  con typescript-eslint (sin reglas type-checked, son las básicas `recommended`).

Comandos:
```bash
npm run dev      # vite, puerto 5173
npm run build     # tsc -b && vite build
npm run lint
```

**Windows/PowerShell**: el operador `&&` no funciona en `powershell.exe` (Windows
PowerShell 5.1) — usa `;` o el tool Bash (Git Bash), que sí soporta `&&`. Ya se
falló una vez con esto en esta sesión: `cd X && npm run dev` en PowerShell da
`ParserError`. Prefiere el tool **Bash** para cadenas de comandos con `&&`.

## Estructura del proyecto

```
src/
  App.tsx              # rutas + estado raíz (sesión, lista de jugadores, filtros)
  App.css              # casi todo el CSS de la app (single-file, ver abajo)
  index.css            # variables de tema (:root) + fondo global
  main.tsx             # bootstrap de React + BrowserRouter
  lib/supabase.ts       # cliente supabase (usa import.meta.env.VITE_SUPABASE_*)
  services/            # una función por operación CRUD, hablan directo con supabase
  types/               # interfaces TS del dominio, en español
  constants/           # tablas fijas (abreviaturas de posición, áreas de radar, temporadas)
  components/          # componentes de presentación + iconos sueltos
  pages/               # páginas de ruta completa (full page, no solo fragmentos)
database/migrations/   # SQL versionado a mano (001_..., 002_..., etc.)
```

### Rutas (definidas en [src/App.tsx](src/App.tsx))

| Ruta | Página/elemento |
|---|---|
| `/` | Lista de jugadores + filtros (inline en `App.tsx`, no en `pages/`) |
| `/jugadores/nuevo` | Formulario nuevo jugador (inline en `App.tsx`) |
| `/jugadores/:jugadorId` | [PlayerDetailPage.tsx](src/pages/PlayerDetailPage.tsx) |
| `/jugadores/:jugadorId/editar` | [EditPlayerPage.tsx](src/pages/EditPlayerPage.tsx) |
| `/comparar` | [ComparePlayersPage.tsx](src/pages/ComparePlayersPage.tsx) |
| `/ojeo-partido` | [MatchScoutingPage.tsx](src/pages/MatchScoutingPage.tsx) — modo pantalla completa |

`AppHeader` (menú principal con iconos) se renderiza en cada página; el logo+texto
enlaza a `/`. `FloatingMatchPill` vive fuera de `<Routes>` en `App.tsx` y aparece en
cualquier página (excepto `/ojeo-partido`) si hay una sesión de partido activa.

## Convenciones de nombres — TODO en español

Variables, funciones, tipos, nombres de props y de columnas de Supabase están **en
español** (`jugador`, `añadirJugador`, `piernaDominante`, `obtenerJugadores`). Los
nombres de archivo/componente van en inglés solo cuando son genéricos de React
(`AppHeader`, `PlayerCard`) — pero su contenido interno sigue en español. No mezclar:
si añades algo nuevo, sigue el idioma del archivo que estás tocando.

- Componentes: PascalCase, un componente por archivo, mismo nombre que el archivo.
- Servicios: `camelCase` + sufijo `Service` (`playerService.ts`, `teamService.ts`),
  funciones exportadas con verbo en español (`obtener*`, `crear*`, `actualizar*`,
  `eliminar*`, `guardar*`).
- Tipos: un archivo por entidad de dominio en `types/`, nombrado en español
  (`jugador.ts`, `observacion.ts`, `historialEquipo.ts`).
- Mapeo DB↔TS: Supabase usa `snake_case` (`altura_cm`, `pierna_dominante`); los
  servicios traducen a interfaces `camelCase` en español (`alturaCm`,
  `piernaDominante`) vía una función `mapear<Entidad>()` local a cada servicio. Ver
  [src/services/playerService.ts](src/services/playerService.ts) como plantilla.

## CSS — un solo archivo grande

Casi todo el estilo vive en **App.css** (single-file, no CSS Modules, no styled-
components). Excepciones puntuales con CSS propio junto al componente:
`DominantFootIndicator.css`, `PositionFieldSelector.css`.

- Variables de tema en `:root` dentro de [src/index.css](src/index.css):
  `--app-background`, `--app-surface`, `--app-surface-raised`, `--app-border`,
  `--app-text`, `--app-muted`, `--app-accent` (verde), `--app-action` (azul).
- Solo tema oscuro, no hay modo claro ni toggle.
- Antes de editar CSS: **usa Grep sobre `App.css` para la clase concreta** en vez de
  leer el archivo entero (2400+ líneas) — es mucho más barato en tokens. Ejemplo:
  `Grep pattern:"\.app-nav" path:src/App.css`.
- Prefijos de clase por área: `player-*` (fichas/detalle jugador), `comparison-*`
  (comparativa), `match-*` (ojeo de partido en vivo), `observation-*` /
  `general-rating-*` (informes), `position-*` (selector de posiciones en campo).

## Iconos

No hay librería de iconos (ni react-icons ni bootstrap-icons). Cada icono es un
componente funcional mínimo que devuelve un `<svg>` inline, sin props, en
`src/components/` (`UsersIcon.tsx`, `PlusIcon.tsx`, `ScalesIcon.tsx`,
`BinocularsIcon.tsx`, `TrashIcon.tsx`, `PencilIcon.tsx`, `FilterIcon.tsx`). Patrón:

```tsx
function NombreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* paths */}
    </svg>
  )
}

export default NombreIcon
```

El tamaño real en pantalla se controla por CSS (p.ej. `.app-nav-link svg { width:
16px; height: 16px; }`), no hardcodeado en el SVG salvo el `viewBox`. Cuando el
usuario pide "un icono como el de esta captura", replica la forma con precisión
(no uses una alternativa "parecida" de una librería mental) — ya ha pedido
correcciones sobre esto (balanza/báscula).

## Contexto y estado global

- `MatchSessionContext` ([src/components/MatchSessionContext.ts](src/components/MatchSessionContext.ts))
  + `MatchSessionProvider`: sesión de partido en vivo (jugadores seguidos, acciones,
  cronómetro, informes por jugador). Se consume con `useMatchSession()`.
- `ToastContext` + `ToastProvider`: notificaciones tipo toast.
- Todo lo demás es estado local por componente/página (`useState`), no hay Redux ni
  Zustand ni React Query — las llamadas a Supabase se hacen directo en `useEffect` +
  funciones de `services/`.

## Base de datos

Migraciones SQL a mano en `database/migrations/`, numeradas y versionadas contra
versiones de la app (`001_ojeo_0_2_2.sql`, etc. — no confundir con `package.json`
`version`, que se quedó en `0.0.0`). Revisa la última migración para saber el
esquema vigente antes de asumir columnas.

## Git y flujo de trabajo — lecciones de esta sesión

- **Nunca hagas `git commit` sin que el usuario lo pida explícitamente**, ni
  siquiera al terminar una tarea que parece completa. Se ha corregido esto en esta
  sesión: proponer el commit y esperar confirmación, no ejecutarlo directamente.
- Antes de tocar UI que "podría romper algo", el usuario prefiere crear una rama
  nueva primero (`git checkout -b feat/...`) en vez de trabajar sobre `main`.
- Mensajes de commit en este repo: `feat: <descripción corta en español, minúsculas,
  sin punto final>` (ver `git log`). No hay `fix:`/`chore:` usados hasta ahora, pero
  seguirían el mismo patrón si tocara.
- El usuario itera visualmente en pasos pequeños (tamaño de un icono, un padding,
  un color) y espera ajustes precisos, no rediseños. No te "expandas" más allá de
  lo pedido (p.ej. no toques 4 propiedades cuando pide ajustar 1).

## Eficiencia de tokens — qué hacer distinto a partir de ahora

- No releas `App.css` completo para un cambio puntual: Grep la clase por nombre.
- No spawnees subagentes (Explore/general-purpose) para tareas de un solo archivo
  o cambios ya localizados por este documento — solo para exploración amplia
  genuina (>3 búsquedas necesarias).
- Antes de buscar "¿dónde está la navegación/el header/el logo?" — ya lo sabes:
  [src/components/AppHeader.tsx](src/components/AppHeader.tsx) +
  clases `.app-nav`, `.app-nav-link`, `.app-brand` en `App.css`.
- Antes de buscar "¿cómo se llama X en la base de datos?" — mira la interfaz
  correspondiente en `types/` y el servicio asociado en `services/`, el mapeo
  snake_case↔camelCase está siempre ahí.
- Si vas a arrancar el dev server para verificar visualmente, usa el tool de
  preview del navegador (`preview_start` con `name: "ojeo-dev"` desde
  `.claude/launch.json`), no `npm run dev` a pelo en Bash salvo que el preview
  falle.
