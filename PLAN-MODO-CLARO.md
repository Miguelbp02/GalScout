# PLAN: Modo claro + conmutador claro/oscuro con preferencia guardada

> **Para el agente que ejecute esto:** este documento es largo a propósito.
> **NO lo leas entero.** Lee solo: las «Reglas de trabajo», el «Contexto técnico»,
> y **la tarea concreta que te toque**. Cada tarea es independiente y está pensada
> para caber en una ventana de contexto pequeña (16k tokens).

---

## Reglas de trabajo (leer SIEMPRE antes de empezar)

1. **Una tarea por sesión.** Haz la tarea, verifica, para. No encadenes tareas.
2. **NUNCA leas `src/App.css` entero.** Tiene 2457 líneas y no cabe en tu contexto.
   Lee solo el rango de líneas que indique tu tarea (`offset` + `limit`).
3. **No inventes colores nuevos.** Todos los colores del modo claro están definidos
   en la tabla de la Fase 1. Si necesitas uno que no está, **para y pregunta**.
4. **No toques ficheros que tu tarea no mencione.**
5. **Verifica antes de dar por terminada la tarea:**
   ```bash
   npx tsc --noEmit
   ```
   Debe salir sin errores. Si tocaste CSS, además abre la app y mira la página afectada.
6. **Un commit por tarea**, con el nombre de la tarea en el mensaje. Así se puede
   revertir una tarea concreta sin perder el resto.
7. Si algo no encaja con lo que dice este plan (el fichero es distinto, la línea no
   existe), **para y avisa**. No improvises.

---

## Contexto técnico (verificado el 2026-07-31)

| Dato | Valor |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| CSS framework | **Bootstrap 5.3.8** (`src/main.tsx` importa `bootstrap.min.css`) |
| Atributo de tema | **`data-bs-theme`** en `<html>` — ya está puesto a `"dark"` en `index.html` |
| CSS propio | `src/index.css` (45 líneas), `src/App.css` (2457 líneas) |
| CSS de componentes | `src/components/PositionFieldSelector.css` (377 líneas), `src/components/DominantFootIndicator.css` (73 líneas) |
| Variables propias existentes | 8, definidas en `src/index.css` bajo `:root` |
| Colores «a pelo» en `App.css` | ~74 hex + ~100 `rgba()` = **~174 sitios** |
| Colores «a pelo» en `PositionFieldSelector.css` | ~55 |

### Las 8 variables que ya existen (`src/index.css`)

```css
--app-background   #111315
--app-surface      #181c20
--app-surface-raised #20252b
--app-border       #46515d
--app-text         #edf5fb
--app-muted        #aab3bc
--app-accent       #61a96b
--app-action       #4d83b5
```

Se usan en 114 sitios de `App.css`. **Esas 114 ya funcionarán solas** en cuanto la
Fase 1 defina sus valores claros. El trabajo real son los ~174 colores a pelo.

### Por qué falló el intento anterior (no repetir estos errores)

1. Usó el atributo **`data-theme`**, pero este proyecto usa Bootstrap 5.3, que
   requiere **`data-bs-theme`**. Resultado: Bootstrap ni se enteraba del cambio.
2. Cambió solo las variables de `index.css` y dejó los ~174 colores a pelo de
   `App.css` en tono oscuro. Resultado: tarjetas claras con texto claro encima
   → texto ilegible (que es exactamente lo que se vio roto en pantalla).

**Conclusión: el conmutador es lo fácil (Fase 0). Lo que hay que hacer bien y
con paciencia es la sustitución de colores a pelo (Fases 2–7).**

---

## FASE 0 — Conmutador de tema (infraestructura)

Al acabar esta fase el botón cambia el tema y lo recuerda, aunque el modo claro
todavía se verá mal. **Eso es normal y esperado.** No intentes arreglar colores aquí.

### Tarea 0.1 — Crear el hook `useTheme`

Crea `src/hooks/useTheme.ts` con exactamente esto:

```ts
import { useEffect, useState } from 'react'

export type Tema = 'light' | 'dark'

const CLAVE_ALMACENAMIENTO = 'galscout-tema'

export function obtenerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO)
  if (guardado === 'light' || guardado === 'dark') return guardado

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(obtenerTemaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
    localStorage.setItem(CLAVE_ALMACENAMIENTO, tema)
  }, [tema])

  const alternarTema = () => {
    setTema((actual) => (actual === 'light' ? 'dark' : 'light'))
  }

  return { tema, alternarTema }
}
```

**Puntos críticos que NO puedes cambiar:**
- El atributo es `data-bs-theme`, **no** `data-theme`.
- El `localStorage.setItem` va **siempre**, sin condición. (El intento anterior lo
  puso dentro de un `if` y por eso no guardaba bien la preferencia).

Verifica: `npx tsc --noEmit`.

---

### Tarea 0.2 — Evitar el parpadeo inicial (FOUC)

En `index.html`, **dentro de `<head>`**, justo antes de `</head>`, añade:

```html
<script>
  (function () {
    var guardado = localStorage.getItem('galscout-tema');
    var tema = guardado === 'light' || guardado === 'dark'
      ? guardado
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-bs-theme', tema);
  })();
</script>
```

Deja el `data-bs-theme="dark"` que ya está en la etiqueta `<html>` — sirve como
valor por defecto si el script fallara.

Sin esto, al recargar en modo claro se ve un fogonazo oscuro antes de que React arranque.

---

### Tarea 0.3 — Crear el icono y el botón del conmutador

Crea `src/components/ThemeToggle.tsx`:

```tsx
import { useTheme } from '../hooks/useTheme'

function ThemeToggle() {
  const { tema, alternarTema } = useTheme()
  const esOscuro = tema === 'dark'

  return (
    <button
      aria-label={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="app-nav-link theme-toggle"
      title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
      type="button"
      onClick={alternarTema}
    >
      {esOscuro ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
      <span>{esOscuro ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  )
}

export default ThemeToggle
```

Reutiliza la clase `app-nav-link`, que ya existe en `App.css` (línea ~548), para que
el botón se vea igual que el resto del menú.

---

### Tarea 0.4 — Colocar el botón en la cabecera

En `src/components/AppHeader.tsx`:

1. Añade el import junto a los demás (arriba del todo):
   ```tsx
   import ThemeToggle from './ThemeToggle'
   ```
2. Dentro del `<nav className="app-nav">`, **justo antes de `{herramientas}`**
   (está sobre la línea 91), añade:
   ```tsx
   <ThemeToggle />
   ```

No cambies nada más de este fichero.

Verifica: `npx tsc --noEmit`, arranca la app y comprueba que el botón aparece en el
menú, que al pulsarlo cambian los componentes de Bootstrap, y que **al recargar la
página se mantiene** la última elección. El resto de la interfaz se verá mal todavía.

---

## FASE 1 — Sistema de tokens de color

Aquí se define la paleta completa. **Es la fase más importante del plan.**
Todas las fases siguientes solo consisten en sustituir colores a pelo por estas variables.

### Tarea 1.1 — Reescribir `src/index.css`

Sustituye el bloque `:root` actual y añade el bloque del modo claro. El fichero
completo queda así:

```css
:root,
[data-bs-theme='dark'] {
  /* --- Superficies y texto --- */
  --app-background: #111315;
  --app-surface: #181c20;
  --app-surface-raised: #20252b;
  --app-border: #46515d;
  --app-text: #edf5fb;
  --app-muted: #aab3bc;
  --app-accent: #61a96b;
  --app-action: #4d83b5;

  /* --- Tarjetas --- */
  --app-card-gradient: linear-gradient(145deg, #252c32 0%, #1d2328 100%);
  --app-card-border: rgba(105, 126, 145, 0.62);

  /* --- Veladuras (capas translúcidas sobre el fondo) --- */
  --app-overlay-soft: rgba(255, 255, 255, 0.05);
  --app-overlay-medium: rgba(255, 255, 255, 0.08);
  --app-overlay-hairline: rgba(255, 255, 255, 0.16);
  --app-scrim: rgba(17, 19, 21, 0.35);
  --app-scrim-strong: rgba(17, 19, 21, 0.7);

  /* --- Sombras --- */
  --app-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.26);
  --app-shadow-md: 0 10px 24px rgba(0, 0, 0, 0.35);
  --app-shadow-lg: 0 14px 36px rgba(0, 0, 0, 0.55);

  /* --- Estados: informativo (azul) --- */
  --app-info-bg: rgba(77, 131, 181, 0.16);
  --app-info-border: rgba(77, 131, 181, 0.7);
  --app-info-text: #c9e5fb;

  /* --- Estados: éxito (verde) --- */
  --app-success-bg: rgba(97, 169, 107, 0.14);
  --app-success-border: rgba(97, 169, 107, 0.55);
  --app-success-text: #bff2d1;

  /* --- Estados: peligro (rojo) --- */
  --app-danger-bg: rgba(240, 115, 111, 0.12);
  --app-danger-border: rgba(207, 75, 84, 0.55);
  --app-danger-text: #ef7777;
  --app-danger-text-soft: #e88a90;

  /* --- Fondo de página --- */
  --app-backdrop-veil: rgba(10, 13, 15, 0.86);

  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--app-text);
  background-color: var(--app-background);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[data-bs-theme='light'] {
  /* --- Superficies y texto (paleta "pizarra fría", aprobada por el usuario) --- */
  --app-background: #c4cbd2;
  --app-surface: #d9dee2;
  --app-surface-raised: #e5e8eb;
  --app-border: #8f99a3;
  --app-text: #1a2027;
  --app-muted: #4d5761;
  --app-accent: #2e6b4f;
  --app-action: #1f4f73;

  /* --- Tarjetas --- */
  --app-card-gradient: linear-gradient(145deg, #dde2e5 0%, #ccd3d9 100%);
  --app-card-border: rgba(143, 153, 163, 0.55);

  /* --- Veladuras --- */
  --app-overlay-soft: rgba(26, 32, 39, 0.04);
  --app-overlay-medium: rgba(26, 32, 39, 0.07);
  --app-overlay-hairline: rgba(26, 32, 39, 0.14);
  --app-scrim: rgba(196, 203, 210, 0.6);
  --app-scrim-strong: rgba(196, 203, 210, 0.88);

  /* --- Sombras --- */
  --app-shadow-sm: 0 2px 4px rgba(20, 26, 33, 0.12);
  --app-shadow-md: 0 10px 24px rgba(20, 26, 33, 0.16);
  --app-shadow-lg: 0 14px 36px rgba(20, 26, 33, 0.2);

  /* --- Estados: informativo --- */
  --app-info-bg: rgba(31, 79, 115, 0.14);
  --app-info-border: rgba(31, 79, 115, 0.55);
  --app-info-text: #163a54;

  /* --- Estados: éxito --- */
  --app-success-bg: rgba(46, 107, 79, 0.14);
  --app-success-border: rgba(46, 107, 79, 0.5);
  --app-success-text: #1e4a37;

  /* --- Estados: peligro --- */
  --app-danger-bg: rgba(192, 57, 66, 0.1);
  --app-danger-border: rgba(192, 57, 66, 0.45);
  --app-danger-text: #b3323b;
  --app-danger-text-soft: #96292f;

  /* --- Fondo de página --- */
  --app-backdrop-veil: rgba(196, 203, 210, 0.9);
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background-color: var(--app-background);
  background-image:
    linear-gradient(var(--app-backdrop-veil), var(--app-backdrop-veil)),
    url('./assets/sarriena-2.webp');
  background-position: center;
  background-attachment: fixed;
  background-size: cover;
}

button {
  cursor: pointer;
}

@media (max-width: 1120px) {
  body {
    background-image: none;
  }
}
```

**Ojo con dos detalles:**
- El selector es `:root, [data-bs-theme='dark']`. Así el modo oscuro sigue siendo
  el valor por defecto si el atributo faltara.
- Las propiedades de tipografía (`font-family`, `color`, etc.) van solo en el
  bloque `:root`, **no** las dupliques en el bloque `light`.

Verifica: en modo oscuro la app debe verse **exactamente igual que antes**. Si algo
cambió en oscuro, te equivocaste en algún valor. En modo claro el fondo ya debería
aclararse, pero las tarjetas seguirán oscuras (se arregla en la Fase 2).

---

## Colores que NO se deben convertir en variables

Estos son **colores semánticos o de dato**, no son «chrome» de la interfaz.
Deben verse igual en claro y en oscuro. **Déjalos tal cual están:**

| Qué | Dónde (líneas aprox. de `App.css`) | Motivo |
|---|---|---|
| Verde del campo de fútbol | 1054–1061, 2129–2133 | Un campo de fútbol es verde en cualquier tema |
| Escala de puntuación (rojo→naranja→amarillo→lima→turquesa) | 1240–1263 | Codifica un valor numérico, no decoración |
| Etiquetas de posición natural/apta (`#3be8c8`, `#c9f227`) | 454–460 | Mismo motivo |
| Colores de jugador en el modo partido | inline en TSX | Los elige el usuario |
| `#fff` de líneas del campo | 1088–1148 | Las líneas del campo son blancas |

Si dudas de si un color es «chrome» o «dato», pregúntate: *¿significa algo?*
Si significa algo → no lo toques.

---

## FASES 2–7 — Sustitución de colores a pelo en `App.css`

**Todas estas tareas siguen el mismo procedimiento mecánico:**

1. Lee **solo** tu rango de líneas:
   `Read src/App.css offset=<inicio> limit=<cantidad>`
2. Busca colores literales: `#xxxxxx` o `rgba(...)`.
3. Para cada uno, decide con esta tabla de equivalencias:

   | Si el color es… | Sustitúyelo por |
   |---|---|
   | un gris/negro de fondo de tarjeta | `var(--app-surface)` o `var(--app-card-gradient)` |
   | un gris de fondo elevado | `var(--app-surface-raised)` |
   | un gris de borde | `var(--app-border)` o `var(--app-card-border)` |
   | un blanco/gris claro de texto | `var(--app-text)` |
   | un gris apagado de texto secundario | `var(--app-muted)` |
   | `rgba(255,255,255, 0.04–0.08)` de fondo | `var(--app-overlay-soft)` / `--app-overlay-medium` |
   | `rgba(255,255,255, ~0.16–0.3)` de borde | `var(--app-overlay-hairline)` |
   | `rgba(17,19,21, ...)` de velo | `var(--app-scrim)` o `--app-scrim-strong` |
   | `box-shadow` con `rgba(0,0,0,...)` | `var(--app-shadow-sm/md/lg)` |
   | azul (`#c9e5fb`, `rgba(77,131,181,...)`) | `var(--app-info-bg/border/text)` |
   | verde de estado (`#bff2d1`, `rgba(97,169,107,...)`) | `var(--app-success-bg/border/text)` |
   | rojo (`#ef7777`, `#e88a90`, `rgba(207,75,84,...)`) | `var(--app-danger-*)` |
   | está en la lista «NO tocar» de arriba | **déjalo igual** |

4. **No cambies nada más**: ni tamaños, ni márgenes, ni el orden de las reglas.
5. Verifica con `npx tsc --noEmit` y mirando la pantalla correspondiente en **los dos modos**.
6. Commit: `style: adapta <zona> al modo claro`.

### Reparto de tareas

| Tarea | Rango de `App.css` | Zona de la app | Colores a pelo aprox. |
|---|---|---|---|
| **2.1** | líneas 1–200 | Estructura general, login, `.card`, avatares, radar de perfil | ~20 |
| **2.2** | líneas 200–520 | Pestañas de detalle de jugador, tarjeta de jugador | ~25 |
| **2.3** | líneas 514–760 | Cabecera, menú de navegación, filtros, sliders de rango | ~25 |
| **2.4** | líneas 747–1010 | Historial de observaciones, botones de borrar/editar | ~20 |
| **2.5** | líneas 1010–1300 | Modo partido, campo, etiquetas, escala de puntuación, botones | ~35 (¡muchos son de la lista «NO tocar»!) |
| **2.6** | líneas 1300–1700 | Comparador, valoraciones medias | ~20 |
| **2.7** | líneas 1700–2100 | Formularios, avisos, toasts | ~15 |
| **2.8** | líneas 2100–2457 | Cuaderno de partido, resto | ~20 |

**Página que revisar tras cada tarea:**
- 2.1 / 2.2 → `/` (lista de jugadores) y detalle de un jugador
- 2.3 → cualquier página (la cabecera está en todas) + abrir el panel de filtros
- 2.4 → detalle de jugador, pestaña «General», historial de observaciones
- 2.5 / 2.8 → `/ojeo-partido`
- 2.6 → `/comparar`
- 2.7 → `/jugadores/nuevo`

---

## FASE 3 — CSS de componentes

### Tarea 3.1 — `src/components/PositionFieldSelector.css` (377 líneas, ~55 colores)

Este fichero pinta **el campo de fútbol** del selector de posiciones. La mayoría de
sus colores son verdes de césped y blancos de líneas → **casi todos van en la lista
«NO tocar»**.

Lee el fichero entero (cabe de sobra) y cambia **solo**:
- Textos de etiquetas que estén en gris claro → `var(--app-text)` / `var(--app-muted)`
- Fondos del panel que rodea al campo (no el campo) → `var(--app-surface)`
- Bordes del contenedor → `var(--app-border)`

**El césped verde, las líneas blancas y los marcadores de posición se quedan igual.**

### Tarea 3.2 — `src/components/DominantFootIndicator.css` (73 líneas, 6 colores)

Fichero pequeño, léelo entero. Son las botas de «pierna dominante». El color de la
bota activa es un dato (verde/turquesa) → no tocar. Sí adapta el gris de la bota
inactiva y cualquier texto: `var(--app-muted)`.

---

## FASE 4 — Repaso final

### Tarea 4.1 — Buscar lo que se haya escapado

```bash
grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src/App.css
```

Repasa la lista resultante. Todo lo que quede debe estar justificado por la lista
«NO tocar». Si hay algo que no lo está, adáptalo.

### Tarea 4.2 — Revisión visual completa en modo claro

Recorre estas pantallas en **modo claro** y anota cualquier texto ilegible
(claro sobre claro) o borde invisible:

- [ ] Login
- [ ] `/` lista de jugadores (con y sin filtros abiertos)
- [ ] Detalle de jugador: pestañas General / Historial / Estadísticas
- [ ] Añadir observación + historial de observaciones
- [ ] `/jugadores/nuevo` y editar jugador
- [ ] `/comparar`
- [ ] `/ojeo-partido` (configuración, campo, cuaderno)
- [ ] Toasts de confirmación
- [ ] Estados de error (formulario incompleto)

Repite el recorrido en **modo oscuro** para confirmar que no se ha roto nada.

---

## Criterio de «terminado»

- [ ] El botón del menú cambia entre claro y oscuro.
- [ ] Al recargar la página se mantiene la última elección (`localStorage`).
- [ ] Si nunca se ha elegido, se respeta la preferencia del sistema operativo.
- [ ] No hay parpadeo oscuro al cargar en modo claro.
- [ ] Modo oscuro se ve **idéntico** a como estaba antes de empezar.
- [ ] En modo claro no hay ningún texto ilegible en las pantallas de la Tarea 4.2.
- [ ] `npx tsc --noEmit` y `npm run build` pasan sin errores.

---

## Si algo sale mal

Cada tarea es un commit. Para deshacer la última:

```bash
git reset --hard HEAD~1
```

Para volver al estado previo a todo el plan, vuelve al commit anterior a la Tarea 0.1.
Por eso es importante **no meter varias tareas en un mismo commit**.
