import { useEffect, useId, useRef, useState } from 'react'
import {
  ZONAS_CAMPO_POSICION,
  obtenerGeometriaZonaPosicion,
} from '../constants/positionFieldLayout'
import type { Posicion } from '../types/posicion'
import './PositionFieldSelector.css'

type TipoPosicion = 'natural' | 'apta' | null
type EstiloEtiquetas = 'ninguna' | 'relieve' | 'recorte'

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

function estiloZona(geometria: ReturnType<typeof obtenerGeometriaZonaPosicion>) {
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
  const temporizadorPulsacion = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulsacionLarga = useRef(false)
  const ultimaInteraccionTactil = useRef(0)
  const posicionesPorCodigo = new Map(
    posiciones.map((posicion) => [posicion.codigo, posicion]),
  )

  useEffect(() => {
    return () => {
      if (temporizadorPulsacion.current) {
        clearTimeout(temporizadorPulsacion.current)
      }
    }
  }, [])

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

    // El portero es una posición exclusiva: nunca puede ser solamente apta.
    if (posicion.codigo === 'portero') {
      onCambiarEstadoPosicion(
        posicion.id,
        estado === 'natural' ? null : 'natural',
      )
      return
    }

    const siguienteEstado =
      estado === null ? 'apta' : estado === 'apta' ? 'natural' : null

    onCambiarEstadoPosicion(posicion.id, siguienteEstado)
  }

  function iniciarPulsacionLarga(
    evento: React.PointerEvent<HTMLButtonElement>,
    posicion: Posicion,
    codigo: string,
  ) {
    if (evento.pointerType !== 'touch') return

    ultimaInteraccionTactil.current = evento.timeStamp
    pulsacionLarga.current = false
    temporizadorPulsacion.current = setTimeout(() => {
      pulsacionLarga.current = true
      onCambiarEstadoPosicion(posicion.id, 'natural')
      setCodigoInfo(codigo)
      navigator.vibrate?.(15)
    }, 500)
  }

  function finalizarPulsacionLarga() {
    if (temporizadorPulsacion.current) {
      clearTimeout(temporizadorPulsacion.current)
      temporizadorPulsacion.current = null
    }
  }

  const zonaInfo = ZONAS_CAMPO_POSICION.find((zona) => zona.codigo === codigoInfo)
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

          {ZONAS_CAMPO_POSICION.map((zona) => {
            const posicion = posicionesPorCodigo.get(zona.codigo)
            const geometria = obtenerGeometriaZonaPosicion(zona)
            const porteroNatural = posiciones.some(
              (posicionCatalogo) =>
                posicionCatalogo.codigo === 'portero' &&
                posicionesNaturalesIds.includes(posicionCatalogo.id),
            )

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
                disabled={
                  disabled ||
                  esResumen ||
                  (porteroNatural && posicion.codigo !== 'portero')
                }
                key={zona.codigo}
                style={estiloZona(geometria)}
                title={posicion.nombre}
                type="button"
                onClick={() => {
                  if (pulsacionLarga.current) {
                    pulsacionLarga.current = false
                    return
                  }
                  ciclarPosicion(posicion)
                  setCodigoInfo(zona.codigo)
                }}
                onPointerDown={(evento) =>
                  iniciarPulsacionLarga(evento, posicion, zona.codigo)
                }
                onPointerUp={finalizarPulsacionLarga}
                onPointerCancel={finalizarPulsacionLarga}
                onContextMenu={(evento) => {
                  evento.preventDefault()
                  if (evento.timeStamp - ultimaInteraccionTactil.current < 1000) return
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
