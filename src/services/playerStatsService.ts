import type { AccionObservacionDePartido, CategoriaEtiquetaAccion } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'

const ETIQUETA_REGATE_EXITOSO = 'Regate exitoso'
const ETIQUETA_REGATE_FALLIDO = 'Regate fallido'
const ETIQUETA_DUELO_GANADO = 'Duelo ganado'
const ETIQUETA_DUELO_PERDIDO = 'Duelo perdido'
const ETIQUETA_GOL = 'Gol'
const ETIQUETA_TIRO_A_PUERTA = 'Tiro a puerta'
const ETIQUETA_OCASION_FALLADA = 'Ocasión fallada'
const ETIQUETA_BLOCAJE_SEGURO = 'Blocaje seguro'
const ETIQUETA_SALIDA_ACERTADA = 'Salida acertada'
const ETIQUETA_GOL_ENCAJADO = 'Gol encajado'
const ETIQUETA_ERROR_PORTERO = 'Error de portero'

/* ------------------------------------------------------------------ *
 * Normalización espacial
 * ------------------------------------------------------------------ */

/**
 * Voltea la coordenada x para que todas las acciones de un jugador se lean
 * siempre atacando hacia la derecha, sin importar en qué mitad o lado del
 * campo se registraron.
 */
export function normalizarX(
  accion: Pick<AccionObservacionDePartido, 'x' | 'direccionAtaque'>,
): number {
  return accion.direccionAtaque === 'derecha' ? accion.x : 100 - accion.x
}

/**
 * Voltea la y junto con la x cuando la acción se registró atacando hacia la
 * izquierda. Espejar solo la x sería una reflexión, no un giro: dejaría la
 * banda izquierda del jugador dibujada como banda derecha. Para que «banda
 * izquierda» signifique siempre lo mismo desde la perspectiva del jugador hay
 * que girar el campo 180º, y un giro voltea las dos coordenadas.
 */
export function normalizarY(
  accion: Pick<AccionObservacionDePartido, 'y' | 'direccionAtaque'>,
): number {
  return accion.direccionAtaque === 'derecha' ? accion.y : 100 - accion.y
}

/**
 * Las etiquetas de sustitución ('Entra al campo' / 'Sale del campo') son
 * categoría 'neutra' y se registran con un x/y ficticio en el centro: no son
 * una jugada, así que quedan fuera de cualquier estadística.
 */
export function filtrarAccionesDeJuego(
  acciones: AccionObservacionDePartido[],
): AccionObservacionDePartido[] {
  return acciones.filter((accion) => accion.categoria !== 'neutra')
}

/* ------------------------------------------------------------------ *
 * Conteos y KPIs
 * ------------------------------------------------------------------ */

export interface ConteoEtiqueta {
  etiquetaNombre: string
  categoria: CategoriaEtiquetaAccion
  total: number
}

export interface KpisAcciones {
  totalAcciones: number
  positivas: number
  negativas: number
  balance: number
  /** Porcentaje 0-100 de acciones positivas, o null si no hay ninguna acción. */
  porcentajePositivas: number | null
  /** Media de acciones por partido seleccionado, o null si no hay partidos. */
  accionesPorPartido: number | null
  /** Partidos que realmente aportaron alguna acción (puede ser < seleccionados). */
  partidosConAcciones: number
}

function contarPorNombres(acciones: AccionObservacionDePartido[], nombres: string[]) {
  return acciones.filter((accion) => nombres.includes(accion.etiquetaNombre)).length
}

export function calcularConteos(acciones: AccionObservacionDePartido[]): ConteoEtiqueta[] {
  const porNombre = new Map<string, ConteoEtiqueta>()

  for (const accion of filtrarAccionesDeJuego(acciones)) {
    const existente = porNombre.get(accion.etiquetaNombre)
    if (existente) {
      existente.total += 1
    } else {
      porNombre.set(accion.etiquetaNombre, {
        etiquetaNombre: accion.etiquetaNombre,
        categoria: accion.categoria,
        total: 1,
      })
    }
  }

  return [...porNombre.values()].sort((a, b) => b.total - a.total)
}

export function calcularKpis(
  acciones: AccionObservacionDePartido[],
  numeroPartidos: number,
): KpisAcciones {
  const deJuego = filtrarAccionesDeJuego(acciones)
  const positivas = deJuego.filter((accion) => accion.categoria === 'positiva').length
  const negativas = deJuego.filter((accion) => accion.categoria === 'negativa').length
  const total = deJuego.length

  return {
    totalAcciones: total,
    positivas,
    negativas,
    balance: positivas - negativas,
    porcentajePositivas: total > 0 ? (positivas / total) * 100 : null,
    accionesPorPartido: numeroPartidos > 0 ? total / numeroPartidos : null,
    partidosConAcciones: new Set(deJuego.map((accion) => accion.observacionId)).size,
  }
}

/* ------------------------------------------------------------------ *
 * Pares de rendimiento y promedios, dependientes del perfil
 * ------------------------------------------------------------------ */

export interface DefinicionPar {
  clave: string
  titulo: string
  /** Se muestra bajo la barra para que el ojeador sepa qué se está comparando. */
  detalleAyuda: string
  positivas: string[]
  negativas: string[]
  /**
   * Los pares núcleo se pintan siempre, aunque sea con «Sin datos»: su ausencia
   * también informa. Los que no son núcleo solo aparecen si tienen registros,
   * para no llenar la pantalla de filas vacías.
   */
  nucleo: boolean
}

export interface ResumenPar extends DefinicionPar {
  aciertos: number
  fallos: number
  intentos: number
  /** Porcentaje 0-100, o null si no hay ninguna acción de este par todavía. */
  porcentajeExito: number | null
}

const PARES_CAMPO: DefinicionPar[] = [
  {
    clave: 'regates',
    titulo: 'Regates completados',
    detalleAyuda: 'Regate exitoso frente a regate fallido',
    positivas: [ETIQUETA_REGATE_EXITOSO],
    negativas: [ETIQUETA_REGATE_FALLIDO],
    nucleo: true,
  },
  {
    clave: 'duelos',
    titulo: 'Duelos ganados',
    detalleAyuda: 'Duelo ganado frente a duelo perdido',
    positivas: [ETIQUETA_DUELO_GANADO],
    negativas: [ETIQUETA_DUELO_PERDIDO],
    nucleo: true,
  },
  {
    clave: 'ocasiones',
    titulo: 'Efectividad en ocasiones',
    detalleAyuda: 'Goles sobre el total de ocasiones generadas',
    positivas: [ETIQUETA_GOL],
    negativas: [ETIQUETA_TIRO_A_PUERTA, ETIQUETA_OCASION_FALLADA],
    nucleo: true,
  },
]

// El perfil de portero solo tiene cuatro etiquetas, así que un único par
// honesto: todo lo que resuelve frente a todo lo que se le escapa. Inventar
// más ratios con tan pocas etiquetas daría una precisión falsa.
const PARES_PORTERO: DefinicionPar[] = [
  {
    clave: 'intervenciones',
    titulo: 'Intervenciones resueltas',
    detalleAyuda: 'Blocajes y salidas frente a goles encajados y errores',
    positivas: [ETIQUETA_BLOCAJE_SEGURO, ETIQUETA_SALIDA_ACERTADA],
    negativas: [ETIQUETA_GOL_ENCAJADO, ETIQUETA_ERROR_PORTERO],
    nucleo: true,
  },
  // Un portero no debería recibir etiquetas de campo, pero si un informe
  // antiguo las tiene se muestran igualmente en vez de esconder el dato.
  ...PARES_CAMPO.map((par) => ({ ...par, nucleo: false })),
]

export function calcularPares(
  acciones: AccionObservacionDePartido[],
  perfil: PerfilScouting,
): ResumenPar[] {
  const deJuego = filtrarAccionesDeJuego(acciones)
  const definiciones = perfil === 'portero' ? PARES_PORTERO : PARES_CAMPO

  return definiciones.map((definicion) => {
    const aciertos = contarPorNombres(deJuego, definicion.positivas)
    const fallos = contarPorNombres(deJuego, definicion.negativas)
    const intentos = aciertos + fallos

    return {
      ...definicion,
      aciertos,
      fallos,
      intentos,
      porcentajeExito: intentos > 0 ? (aciertos / intentos) * 100 : null,
    }
  })
}

/* ------------------------------------------------------------------ *
 * Reparto temporal
 * ------------------------------------------------------------------ */

export interface TramoAcciones {
  etiqueta: string
  desde: number
  hasta: number
  positivas: number
  negativas: number
  total: number
}

export interface ResumenParte {
  parte: 1 | 2
  positivas: number
  negativas: number
  total: number
}

export interface ResumenTiempo {
  tramos: TramoAcciones[]
  partes: ResumenParte[]
  /** Máximo de acciones en un tramo, para escalar las barras. 0 si no hay datos. */
  maximoTramo: number
  primerMinuto: number | null
  ultimoMinuto: number | null
  /**
   * false si todas las acciones están en el minuto 0. Pasa cuando el ojeador
   * anota sin el cronómetro en marcha: el reparto por tramos no significaría
   * nada y hay que ocultarlo en vez de dibujar una única columna engañosa.
   */
  hayMinutosRegistrados: boolean
}

export const TRAMOS_POR_PARTIDO = 6
const DURACION_TRAMO = 15

/**
 * El descuento y la prórroga caen en el último tramo en lugar de abrir tramos
 * nuevos: el eje se mantiene en los 90' de siempre, que es como un ojeador lee
 * un partido, y una acción en el 95' sigue contando donde le corresponde.
 */
function indiceTramo(minuto: number): number {
  return Math.min(TRAMOS_POR_PARTIDO - 1, Math.floor(Math.max(0, minuto) / DURACION_TRAMO))
}

export function calcularTiempo(acciones: AccionObservacionDePartido[]): ResumenTiempo {
  const deJuego = filtrarAccionesDeJuego(acciones)

  const tramos: TramoAcciones[] = Array.from({ length: TRAMOS_POR_PARTIDO }, (_, indice) => {
    const desde = indice * DURACION_TRAMO
    const hasta = desde + DURACION_TRAMO
    const dentro = deJuego.filter((accion) => indiceTramo(accion.minuto) === indice)
    const positivas = dentro.filter((accion) => accion.categoria === 'positiva').length

    return {
      etiqueta: `${desde}-${hasta}'`,
      desde,
      hasta,
      positivas,
      negativas: dentro.length - positivas,
      total: dentro.length,
    }
  })

  const partes: ResumenParte[] = ([1, 2] as const).map((parte) => {
    const dentro = deJuego.filter((accion) => accion.parte === parte)
    const positivas = dentro.filter((accion) => accion.categoria === 'positiva').length

    return { parte, positivas, negativas: dentro.length - positivas, total: dentro.length }
  })

  const minutos = deJuego.map((accion) => accion.minuto)

  return {
    tramos,
    partes,
    maximoTramo: tramos.reduce((maximo, tramo) => Math.max(maximo, tramo.total), 0),
    primerMinuto: minutos.length > 0 ? Math.min(...minutos) : null,
    ultimoMinuto: minutos.length > 0 ? Math.max(...minutos) : null,
    hayMinutosRegistrados: minutos.some((minuto) => minuto > 0),
  }
}

/* ------------------------------------------------------------------ *
 * Reparto por zonas del campo
 * ------------------------------------------------------------------ */

export type TercioCampo = 'defensivo' | 'medio' | 'ofensivo'
export type CarrilCampo = 'izquierdo' | 'central' | 'derecho'

export interface CeldaZona {
  tercio: TercioCampo
  carril: CarrilCampo
  positivas: number
  negativas: number
  total: number
}

export interface ResumenZonas {
  /** Nueve celdas, siempre en el mismo orden: por tercio y dentro de él por carril. */
  celdas: CeldaZona[]
  maximoCelda: number
  porTercio: Record<TercioCampo, number>
  porCarril: Record<CarrilCampo, number>
  /** Porcentaje 0-100 de acciones en campo contrario, o null si no hay datos. */
  porcentajeCampoContrario: number | null
}

const TERCIOS: TercioCampo[] = ['defensivo', 'medio', 'ofensivo']
const CARRILES: CarrilCampo[] = ['izquierdo', 'central', 'derecho']

function tercioDe(xNormalizada: number): TercioCampo {
  if (xNormalizada < 100 / 3) return 'defensivo'
  if (xNormalizada < 200 / 3) return 'medio'
  return 'ofensivo'
}

// Con el jugador atacando siempre hacia la derecha, su mano izquierda apunta a
// la y pequeña: por eso y baja es la banda izquierda.
function carrilDe(yNormalizada: number): CarrilCampo {
  if (yNormalizada < 100 / 3) return 'izquierdo'
  if (yNormalizada < 200 / 3) return 'central'
  return 'derecho'
}

export function calcularZonas(acciones: AccionObservacionDePartido[]): ResumenZonas {
  const deJuego = filtrarAccionesDeJuego(acciones)

  const celdas: CeldaZona[] = TERCIOS.flatMap((tercio) =>
    CARRILES.map((carril) => ({ tercio, carril, positivas: 0, negativas: 0, total: 0 })),
  )
  const indice = new Map(celdas.map((celda) => [`${celda.tercio}|${celda.carril}`, celda]))

  const porTercio: Record<TercioCampo, number> = { defensivo: 0, medio: 0, ofensivo: 0 }
  const porCarril: Record<CarrilCampo, number> = { izquierdo: 0, central: 0, derecho: 0 }
  let enCampoContrario = 0

  for (const accion of deJuego) {
    const xNormalizada = normalizarX(accion)
    const tercio = tercioDe(xNormalizada)
    const carril = carrilDe(normalizarY(accion))
    const celda = indice.get(`${tercio}|${carril}`)

    if (celda) {
      celda.total += 1
      if (accion.categoria === 'positiva') celda.positivas += 1
      else celda.negativas += 1
    }

    porTercio[tercio] += 1
    porCarril[carril] += 1
    if (xNormalizada >= 50) enCampoContrario += 1
  }

  return {
    celdas,
    maximoCelda: celdas.reduce((maximo, celda) => Math.max(maximo, celda.total), 0),
    porTercio,
    porCarril,
    porcentajeCampoContrario:
      deJuego.length > 0 ? (enCampoContrario / deJuego.length) * 100 : null,
  }
}

/* ------------------------------------------------------------------ *
 * Reparto por partido
 * ------------------------------------------------------------------ */

export interface ResumenPorPartido {
  observacionId: string
  positivas: number
  negativas: number
  total: number
  balance: number
}

export function calcularPorPartido(
  acciones: AccionObservacionDePartido[],
): Map<string, ResumenPorPartido> {
  const porPartido = new Map<string, ResumenPorPartido>()

  for (const accion of filtrarAccionesDeJuego(acciones)) {
    let resumen = porPartido.get(accion.observacionId)
    if (!resumen) {
      resumen = {
        observacionId: accion.observacionId,
        positivas: 0,
        negativas: 0,
        total: 0,
        balance: 0,
      }
      porPartido.set(accion.observacionId, resumen)
    }

    resumen.total += 1
    if (accion.categoria === 'positiva') resumen.positivas += 1
    else resumen.negativas += 1
    resumen.balance = resumen.positivas - resumen.negativas
  }

  return porPartido
}

/* ------------------------------------------------------------------ *
 * Fiabilidad de la muestra
 * ------------------------------------------------------------------ */

export type NivelMuestra = 'sin-datos' | 'baja' | 'media' | 'suficiente'

/**
 * Aquí la escasez de datos no es un estado transitorio: son unos pocos
 * ojeadores anotando a mano en categorías donde la liga no publica más que
 * goles y tarjetas. Nunca habrá volumen para percentiles ni para comparar
 * contra una media de la competición, así que lo único honesto es decir de
 * cuánto se está hablando. Sin este aviso, un 100 % salido de un único intento
 * se lee como una virtud del jugador; etiquetar la muestra es lo que separa un
 * dato de una impresión.
 */
export function evaluarMuestra(numeroPartidos: number, totalAcciones: number): NivelMuestra {
  if (totalAcciones === 0) return 'sin-datos'
  if (numeroPartidos < 3 || totalAcciones < 10) return 'baja'
  if (totalAcciones < 30) return 'media'
  return 'suficiente'
}

export const TEXTO_MUESTRA: Record<NivelMuestra, string> = {
  'sin-datos': 'Sin acciones registradas',
  baja: 'Muestra baja: léelo como indicio, no como tendencia',
  media: 'Muestra moderada',
  suficiente: 'Muestra suficiente',
}
