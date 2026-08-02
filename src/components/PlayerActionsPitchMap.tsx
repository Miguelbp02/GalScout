import { useRef, useState } from 'react'
import { normalizarX, normalizarY } from '../services/playerStatsService'
import PitchOutlineSvg, { ALTO_CAMPO, ANCHO_CAMPO } from './PitchOutlineSvg'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { ResumenZonas } from '../services/playerStatsService'

export type ModoMapa = 'puntos' | 'zonas'

interface PlayerActionsPitchMapProps {
  /** Acciones ya filtradas por el llamante: aquí solo se dibujan. */
  acciones: AccionObservacionDePartido[]
  modo: ModoMapa
  zonas: ResumenZonas
}

interface PuntoHover {
  texto: string
  left: number
  top: number
}

// El campo se dibuja en horizontal (105x68) y el grupo se gira 90º para verlo
// en vertical: campo propio abajo, portería rival arriba, que es como se lee
// un mapa de acciones. Los tercios se marcan a un tercio y dos tercios del
// largo, que es exactamente donde corta `calcularZonas`.
const TERCIO = ANCHO_CAMPO / 3
const CARRIL = ALTO_CAMPO / 3

function PlayerActionsPitchMap({ acciones, modo, zonas }: PlayerActionsPitchMapProps) {
  const [puntoHover, setPuntoHover] = useState<PuntoHover | null>(null)
  const campoRef = useRef<HTMLDivElement>(null)

  function mostrarHover(evento: React.MouseEvent, texto: string) {
    const contenedor = campoRef.current
    if (!contenedor) return

    const rect = contenedor.getBoundingClientRect()
    setPuntoHover({ texto, left: evento.clientX - rect.left, top: evento.clientY - rect.top })
  }

  const resumenAccesible =
    modo === 'puntos'
      ? `Mapa con ${acciones.length} acciones sobre el campo`
      : `Mapa de zonas del campo con ${acciones.length} acciones repartidas en nueve áreas`

  return (
    <div className="stats-pitch-map-campo" ref={campoRef}>
      <svg
        aria-label={resumenAccesible}
        role="img"
        viewBox={`0 0 ${ALTO_CAMPO} ${ANCHO_CAMPO}`}
      >
        <g transform={`translate(0, ${ANCHO_CAMPO}) rotate(-90)`}>
          <PitchOutlineSvg />

          {modo === 'zonas' &&
            zonas.celdas.map((celda) => {
              const indiceTercio = ['defensivo', 'medio', 'ofensivo'].indexOf(celda.tercio)
              const indiceCarril = ['izquierdo', 'central', 'derecho'].indexOf(celda.carril)
              const x = indiceTercio * TERCIO
              const y = indiceCarril * CARRIL
              const centroX = x + TERCIO / 2
              const centroY = y + CARRIL / 2
              const intensidad =
                zonas.maximoCelda > 0 && celda.total > 0
                  ? 0.14 + 0.5 * (celda.total / zonas.maximoCelda)
                  : 0

              return (
                <g key={`${celda.tercio}-${celda.carril}`}>
                  <rect
                    fill="var(--app-pitch-celda)"
                    fillOpacity={intensidad}
                    height={CARRIL}
                    stroke="var(--app-pitch-linea)"
                    strokeWidth="0.2"
                    width={TERCIO}
                    x={x}
                    y={y}
                  />
                  {celda.total > 0 && (
                    // El grupo padre está girado -90º, así que el número hay
                    // que contra-rotarlo para que se lea en horizontal.
                    <text
                      className="stats-pitch-map-celda-texto"
                      dominantBaseline="central"
                      textAnchor="middle"
                      transform={`rotate(90 ${centroX} ${centroY})`}
                      x={centroX}
                      y={centroY}
                    >
                      {celda.total}
                    </text>
                  )}
                </g>
              )
            })}

          {modo === 'puntos' &&
            acciones.map((accion) => (
              <circle
                className="stats-pitch-map-punto"
                cx={(normalizarX(accion) / 100) * ANCHO_CAMPO}
                cy={(normalizarY(accion) / 100) * ALTO_CAMPO}
                fill={
                  accion.categoria === 'positiva'
                    ? 'var(--app-pitch-positiva)'
                    : 'var(--app-pitch-negativa)'
                }
                key={accion.id}
                r="1.4"
                stroke="var(--app-pitch-trazo)"
                strokeWidth="0.28"
                onMouseEnter={(evento) =>
                  mostrarHover(evento, `${accion.etiquetaNombre} · min ${accion.minuto}'`)
                }
                onMouseLeave={() => setPuntoHover(null)}
                onMouseMove={(evento) =>
                  mostrarHover(evento, `${accion.etiquetaNombre} · min ${accion.minuto}'`)
                }
              >
                <title>{`${accion.etiquetaNombre} · minuto ${accion.minuto}`}</title>
              </circle>
            ))}
        </g>
      </svg>

      <span aria-hidden="true" className="stats-pitch-map-sentido">
        Ataca hacia arriba
      </span>

      {puntoHover && (
        <div
          className="stats-pitch-map-tooltip"
          style={{ left: puntoHover.left, top: puntoHover.top }}
        >
          {puntoHover.texto}
        </div>
      )}
    </div>
  )
}

export default PlayerActionsPitchMap
