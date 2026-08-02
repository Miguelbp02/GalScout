import type { AccionObservacionDePartido, CategoriaEtiquetaAccion } from '../types/accionObservacion'

const ETIQUETA_REGATE_EXITOSO = 'Regate exitoso'
const ETIQUETA_REGATE_FALLIDO = 'Regate fallido'
const ETIQUETA_DUELO_GANADO = 'Duelo ganado'
const ETIQUETA_DUELO_PERDIDO = 'Duelo perdido'
const ETIQUETA_PERDIDA = 'Pérdida'
const ETIQUETA_GOL = 'Gol'
const ETIQUETA_TIRO_A_PUERTA = 'Tiro a puerta'
const ETIQUETA_OCASION_FALLADA = 'Ocasión fallada'

export interface ResumenParEtiquetas {
  etiquetaPositiva: string
  etiquetaNegativa: string
  positivos: number
  negativos: number
  /** Porcentaje de 0 a 100, o null si no hay ninguna acción de este par todavía. */
  porcentajeExito: number | null
}

export interface ConteoEtiqueta {
  etiquetaNombre: string
  categoria: CategoriaEtiquetaAccion
  total: number
}

export interface ResumenAccionesJugador {
  regates: ResumenParEtiquetas
  duelos: ResumenParEtiquetas
  perdidasPromedioPorPartido: number
  /** Goles / (Goles + Tiros a puerta + Ocasiones falladas), o null si no hay ninguna. */
  efectividadOcasiones: number | null
  conteos: ConteoEtiqueta[]
}

/**
 * Voltea la coordenada x para que todas las acciones de un jugador se lean
 * siempre atacando hacia la derecha, sin importar en qué mitad o lado del
 * campo se registraron. La coordenada y no se toca: representa el ancho del
 * campo (banda a banda), que no depende de la dirección de ataque.
 */
export function normalizarX(
  accion: Pick<AccionObservacionDePartido, 'x' | 'direccionAtaque'>,
): number {
  return accion.direccionAtaque === 'derecha' ? accion.x : 100 - accion.x
}

function contarPorNombre(acciones: AccionObservacionDePartido[], nombre: string) {
  return acciones.filter((accion) => accion.etiquetaNombre === nombre).length
}

function calcularPar(
  acciones: AccionObservacionDePartido[],
  etiquetaPositiva: string,
  etiquetaNegativa: string,
): ResumenParEtiquetas {
  const positivos = contarPorNombre(acciones, etiquetaPositiva)
  const negativos = contarPorNombre(acciones, etiquetaNegativa)
  const total = positivos + negativos

  return {
    etiquetaPositiva,
    etiquetaNegativa,
    positivos,
    negativos,
    porcentajeExito: total > 0 ? (positivos / total) * 100 : null,
  }
}

/**
 * Recibe las acciones ya cargadas de los partidos seleccionados (ver
 * `obtenerAccionesDeObservaciones`) y el número de partidos que forman ese
 * conjunto (para las medias "por partido"). No hace llamadas a Supabase.
 */
export function calcularResumenAcciones(
  acciones: AccionObservacionDePartido[],
  numeroPartidos: number,
): ResumenAccionesJugador {
  // Las etiquetas de sustitución ('Entra al campo' / 'Sale del campo') son
  // categoría 'neutra' y no representan una jugada en el campo: se excluyen
  // de las estadísticas.
  const accionesDeJuego = acciones.filter((accion) => accion.categoria !== 'neutra')

  const goles = contarPorNombre(accionesDeJuego, ETIQUETA_GOL)
  const tirosAPuerta = contarPorNombre(accionesDeJuego, ETIQUETA_TIRO_A_PUERTA)
  const ocasionesFalladas = contarPorNombre(accionesDeJuego, ETIQUETA_OCASION_FALLADA)
  const denominadorOcasiones = goles + tirosAPuerta + ocasionesFalladas

  const conteosPorNombre = new Map<string, ConteoEtiqueta>()
  for (const accion of accionesDeJuego) {
    const existente = conteosPorNombre.get(accion.etiquetaNombre)
    if (existente) {
      existente.total += 1
    } else {
      conteosPorNombre.set(accion.etiquetaNombre, {
        etiquetaNombre: accion.etiquetaNombre,
        categoria: accion.categoria,
        total: 1,
      })
    }
  }

  return {
    regates: calcularPar(accionesDeJuego, ETIQUETA_REGATE_EXITOSO, ETIQUETA_REGATE_FALLIDO),
    duelos: calcularPar(accionesDeJuego, ETIQUETA_DUELO_GANADO, ETIQUETA_DUELO_PERDIDO),
    perdidasPromedioPorPartido:
      numeroPartidos > 0 ? contarPorNombre(accionesDeJuego, ETIQUETA_PERDIDA) / numeroPartidos : 0,
    efectividadOcasiones:
      denominadorOcasiones > 0 ? (goles / denominadorOcasiones) * 100 : null,
    conteos: [...conteosPorNombre.values()].sort((a, b) => b.total - a.total),
  }
}
