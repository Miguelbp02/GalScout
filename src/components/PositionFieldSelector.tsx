import { useId, useState } from 'react'
import type { Posicion } from '../types/posicion'
import './PositionFieldSelector.css'

type TipoPosicion = 'natural' | 'apta' | null
type EstiloEtiquetas = 'ninguna' | 'relieve' | 'recorte'

interface ZonaCampo {
  codigo: string
  abreviatura: string
  columna: 0 | 1 | 2
  fila: number
  filas?: number
}

interface GeometriaZona {
  izquierda: number
  arriba: number
  ancho: number
  alto: number
}

interface PositionFieldSelectorProps {
  posiciones: Posicion[]
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  disabled?: boolean
  inclinado?: boolean
  etiquetas?: EstiloEtiquetas
  mostrarEstado?: boolean
  modo?: 'edicion' | 'resumen'
  mostrarLeyendaResumen?: boolean
  onCambiarEstadoPosicion?: (posicionId: number, tipo: TipoPosicion) => void
}

const MARGEN_X = 3
const MARGEN_Y = 4
const HUECO = 1.2
const ANCHO_CENTRO = 37.6
const ANCHO_BANDA = (100 - MARGEN_X * 2 - HUECO * 2 - ANCHO_CENTRO) / 2
const ANCHOS_COLUMNA = [ANCHO_BANDA, ANCHO_CENTRO, ANCHO_BANDA]
const IZQUIERDAS_COLUMNA = [
  MARGEN_X,
  MARGEN_X + ANCHO_BANDA + HUECO,
  MARGEN_X + ANCHO_BANDA + HUECO + ANCHO_CENTRO + HUECO,
]
const ALTO_FILA = (100 - MARGEN_Y * 2 - HUECO * 6) / 7

const zonasCampo: ZonaCampo[] = [
  { codigo: 'extremo_izquierdo', abreviatura: 'EI', columna: 0, fila: 0, filas: 2 },
  { codigo: 'delantero_centro', abreviatura: 'DC', columna: 1, fila: 0 },
  { codigo: 'extremo_derecho', abreviatura: 'ED', columna: 2, fila: 0, filas: 2 },
  { codigo: 'segundo_delantero', abreviatura: 'SD', columna: 1, fila: 1 },
  { codigo: 'interior_izquierdo', abreviatura: 'II', columna: 0, fila: 2 },
  { codigo: 'mediapunta', abreviatura: 'MP', columna: 1, fila: 2 },
  { codigo: 'interior_derecho', abreviatura: 'ID', columna: 2, fila: 2 },
  { codigo: 'carrilero_izquierdo', abreviatura: 'CRI', columna: 0, fila: 3, filas: 2 },
  { codigo: 'mediocentro', abreviatura: 'MC', columna: 1, fila: 3 },
  { codigo: 'carrilero_derecho', abreviatura: 'CRD', columna: 2, fila: 3, filas: 2 },
  { codigo: 'mediocentro_defensivo', abreviatura: 'MCD', columna: 1, fila: 4 },
  { codigo: 'lateral_izquierdo', abreviatura: 'LI', columna: 0, fila: 5, filas: 2 },
  { codigo: 'defensa_central', abreviatura: 'DFC', columna: 1, fila: 5 },
  { codigo: 'lateral_derecho', abreviatura: 'LD', columna: 2, fila: 5, filas: 2 },
  { codigo: 'portero', abreviatura: 'PT', columna: 1, fila: 6 },
]

function geometriaZona(zona: ZonaCampo): GeometriaZona {
  const filas = zona.filas ?? 1

  return {
    izquierda: IZQUIERDAS_COLUMNA[zona.columna],
    arriba: MARGEN_Y + zona.fila * (ALTO_FILA + HUECO),
    ancho: ANCHOS_COLUMNA[zona.columna],
    alto: ALTO_FILA * filas + HUECO * (filas - 1),
  }
}

function estiloZona(geometria: GeometriaZona) {
  return {
    left: `${geometria.izquierda}%`,
    top: `${geometria.arriba}%`,
    width: `${geometria.ancho}%`,
    height: `${geometria.alto}%`,
  }
}

function LineasCampo() {
  return (
    <svg
      aria-hidden="true"
      className="position-field-lines"
      viewBox="0 0 680 1050"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5">
        <rect height="1010" width="640" x="20" y="20" />
        <line x1="20" x2="660" y1="525" y2="525" />
        <circle cx="340" cy="525" r="88" />
        <rect height="159" width="379" x="150.5" y="20" />
        <rect height="53" width="172" x="254" y="20" />
        <path d="M 274.3 179 A 86 86 0 0 0 405.7 179" />
        <rect height="159" width="379" x="150.5" y="871" />
        <rect height="53" width="172" x="254" y="977" />
        <path d="M 274.3 871 A 86 86 0 0 1 405.7 871" />
        <path d="M 20 40 A 20 20 0 0 0 40 20" />
        <path d="M 640 20 A 20 20 0 0 0 660 40" />
        <path d="M 660 1010 A 20 20 0 0 0 640 1030" />
        <path d="M 40 1030 A 20 20 0 0 0 20 1010" />
      </g>
      <g fill="rgba(255,255,255,0.28)">
        <circle cx="340" cy="525" r="3.5" />
        <circle cx="340" cy="123.5" r="3.5" />
        <circle cx="340" cy="926.5" r="3.5" />
      </g>
    </svg>
  )
}

function PositionFieldSelector({
  posiciones,
  posicionesNaturalesIds,
  posicionesAptasIds,
  disabled = false,
  inclinado = true,
  etiquetas = 'recorte',
  mostrarEstado = false,
  modo = 'edicion',
  mostrarLeyendaResumen = true,
  onCambiarEstadoPosicion = () => {},
}: PositionFieldSelectorProps) {
  const esResumen = modo === 'resumen'
  const [codigoInfo, setCodigoInfo] = useState<string | null>(null)
  const idBase = useId().replace(/:/g, '')
  const posicionesPorCodigo = new Map(
    posiciones.map((posicion) => [posicion.codigo, posicion]),
  )

  function estadoPosicion(posicion: Posicion): TipoPosicion {
    if (posicionesNaturalesIds.includes(posicion.id)) return 'natural'
    if (posicionesAptasIds.includes(posicion.id)) return 'apta'

    return null
  }

  function claseZona(posicion: Posicion) {
    const estado = estadoPosicion(posicion)
    return estado ? `position-zone-${estado}` : 'position-zone-empty'
  }

  function etiquetaEstado(posicion: Posicion) {
    const estado = estadoPosicion(posicion)
    if (estado === 'natural') return 'Natural'
    if (estado === 'apta') return 'Apta'
    return 'Sin marcar'
  }

  function ciclarPosicion(posicion: Posicion) {
    const estado = estadoPosicion(posicion)
    const siguienteEstado =
      estado === null ? 'apta' : estado === 'apta' ? 'natural' : null

    onCambiarEstadoPosicion(posicion.id, siguienteEstado)
  }

  const zonaInfo = zonasCampo.find((zona) => zona.codigo === codigoInfo)
  const posicionInfo = zonaInfo ? posicionesPorCodigo.get(zonaInfo.codigo) : undefined

  return (
    <section
      aria-label={esResumen ? 'Mapa de posiciones del jugador' : undefined}
      aria-labelledby={esResumen ? undefined : 'field-selector-title'}
      className={esResumen ? 'position-field-selector--resumen' : undefined}
    >
      {!esResumen && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h3 id="field-selector-title" className="h6 mb-1">
              Perfil posicional
            </h3>
            <p className="small text-body-secondary mb-0">
              Clic: apta → natural → sin marcar. Clic derecho: limpiar.
            </p>
          </div>
          <div className="position-field-legend small">
            <span><i className="position-legend position-legend-natural" /> Natural</span>
            <span><i className="position-legend position-legend-apta" /> Apta</span>
          </div>
        </div>
      )}

      {esResumen && mostrarLeyendaResumen && (
        <div className="position-summary-header">
          <span className="position-summary-title">Posición:</span>
          <div className="position-field-legend small">
            <span><i className="position-legend position-legend-natural" /> Natural</span>
            <span><i className="position-legend position-legend-apta" /> Apta</span>
          </div>
        </div>
      )}

      <div className="position-field-scene">
        <div
          className={`position-field ${inclinado ? 'position-field-tilted' : ''} ${
            esResumen ? 'position-field-compact' : ''
          }`}
        >
          <LineasCampo />

          {zonasCampo.map((zona) => {
            const posicion = posicionesPorCodigo.get(zona.codigo)
            const geometria = geometriaZona(zona)

            if (!posicion) {
              return (
                <button
                  aria-label={`${zona.abreviatura}. Posición no disponible`}
                  className="position-zone position-zone-placeholder"
                  disabled
                  key={zona.codigo}
                  style={estiloZona(geometria)}
                  type="button"
                >
                  {etiquetas !== 'ninguna' && (
                    <span aria-hidden="true" className="position-zone-abbr">
                      {zona.abreviatura}
                    </span>
                  )}
                </button>
              )
            }

            const estado = claseZona(posicion)
            const conRecorte = etiquetas === 'recorte' && estado !== 'position-zone-empty'
            const idMascara = `recorte-${idBase}-${zona.codigo}`

            return (
              <button
                aria-label={`${posicion.nombre}. ${etiquetaEstado(posicion)}`}
                className={`position-zone ${estado} ${
                  conRecorte ? 'position-zone-recortada' : ''
                }`}
                disabled={disabled || esResumen}
                key={zona.codigo}
                style={estiloZona(geometria)}
                title={posicion.nombre}
                type="button"
                onClick={() => {
                  ciclarPosicion(posicion)
                  setCodigoInfo(zona.codigo)
                }}
                onContextMenu={(evento) => {
                  evento.preventDefault()
                  onCambiarEstadoPosicion(posicion.id, null)
                  setCodigoInfo(zona.codigo)
                }}
                onFocus={() => setCodigoInfo(zona.codigo)}
                onMouseEnter={() => setCodigoInfo(zona.codigo)}
              >
                {conRecorte ? (
                  <svg aria-hidden="true" className="position-zone-plate">
                    <mask id={idMascara}>
                      <rect fill="#fff" height="100%" rx="3" width="100%" />
                      <text dominantBaseline="central" textAnchor="middle" x="50%" y="52%">
                        {zona.abreviatura}
                      </text>
                    </mask>
                    <rect
                      fill="currentColor"
                      height="100%"
                      mask={`url(#${idMascara})`}
                      rx="3"
                      width="100%"
                    />
                  </svg>
                ) : (
                  etiquetas !== 'ninguna' && (
                    <span aria-hidden="true" className="position-zone-abbr">
                      {zona.abreviatura}
                    </span>
                  )
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Disponible para una futura vista informativa; se oculta en el formulario. */}
      {!esResumen && mostrarEstado && (
        <div aria-live="polite" className="position-field-status">
          {posicionInfo ? (
            <>
              <i
                className={`position-status-dot ${
                  estadoPosicion(posicionInfo) === 'natural'
                    ? 'position-status-dot-natural'
                    : estadoPosicion(posicionInfo) === 'apta'
                      ? 'position-status-dot-apta'
                      : ''
                }`}
              />
              <span className="position-status-nombre">{posicionInfo.nombre}</span>
              <span className="position-status-estado">{etiquetaEstado(posicionInfo)}</span>
            </>
          ) : (
            <span className="position-status-vacio">
              Pasa el cursor o pulsa sobre una zona del campo
            </span>
          )}
        </div>
      )}
    </section>
  )
}

export default PositionFieldSelector
