import { useEffect, useRef, useState } from 'react'
import { obtenerEtiquetasAccion } from '../services/actionTagService'
import { normalizarX } from '../services/playerStatsService'
import PitchOutlineSvg, { ALTO_CAMPO, ANCHO_CAMPO } from './PitchOutlineSvg'
import type { AccionObservacionDePartido, EtiquetaAccion } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'

interface PlayerActionsPitchMapProps {
  acciones: AccionObservacionDePartido[]
  perfilScouting: PerfilScouting
}

const COLOR_POSITIVA = 'var(--app-success-text)'
const COLOR_NEGATIVA = 'var(--app-danger-text-soft)'

interface PuntoHover {
  minuto: number
  left: number
  top: number
}

function PlayerActionsPitchMap({ acciones, perfilScouting }: PlayerActionsPitchMapProps) {
  const [etiquetas, setEtiquetas] = useState<EtiquetaAccion[]>([])
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [puntoHover, setPuntoHover] = useState<PuntoHover | null>(null)
  const campoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelado = false

    obtenerEtiquetasAccion(perfilScouting)
      .then((datos) => {
        if (cancelado) return
        const normales = datos.filter((etiqueta) => !etiqueta.esSustitucion)
        setEtiquetas(normales)
        setSeleccionadas(new Set(normales.map((etiqueta) => etiqueta.nombre)))
      })
      .catch(() => {
        if (!cancelado) setEtiquetas([])
      })

    return () => {
      cancelado = true
    }
  }, [perfilScouting])

  const etiquetasPositivas = etiquetas.filter((etiqueta) => etiqueta.categoria === 'positiva')
  const etiquetasNegativas = etiquetas.filter((etiqueta) => etiqueta.categoria === 'negativa')

  function alternarEtiqueta(nombre: string) {
    setSeleccionadas((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(nombre)) {
        nuevo.delete(nombre)
      } else {
        nuevo.add(nombre)
      }
      return nuevo
    })
  }

  const accionesVisibles = acciones.filter(
    (accion) => accion.categoria !== 'neutra' && seleccionadas.has(accion.etiquetaNombre),
  )

  function mostrarHover(evento: React.MouseEvent, minuto: number) {
    const contenedor = campoRef.current
    if (!contenedor) return

    const rect = contenedor.getBoundingClientRect()
    setPuntoHover({
      minuto,
      left: evento.clientX - rect.left,
      top: evento.clientY - rect.top,
    })
  }

  function renderLista(lista: EtiquetaAccion[], claseColor: string) {
    return (
      <div className="stats-pitch-map-grupo">
        {lista.map((etiqueta) => (
          <label className="stats-pitch-map-check" key={etiqueta.id}>
            <input
              checked={seleccionadas.has(etiqueta.nombre)}
              type="checkbox"
              onChange={() => alternarEtiqueta(etiqueta.nombre)}
            />
            <i aria-hidden="true" className={`stats-pitch-map-dot ${claseColor}`} />
            {etiqueta.nombre}
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="stats-pitch-map">
      <div className="stats-pitch-map-filtros">
        {renderLista(etiquetasPositivas, 'stats-pitch-map-dot--positiva')}
        {renderLista(etiquetasNegativas, 'stats-pitch-map-dot--negativa')}
      </div>

      <div className="stats-pitch-map-campo" ref={campoRef}>
        {/* El campo se dibuja en horizontal (105x68) y se gira 90º para
            mostrarlo en vertical: campo propio abajo, campo contrario
            arriba, que es como todo el mundo espera leer un mapa así. */}
        <svg viewBox={`0 0 ${ALTO_CAMPO} ${ANCHO_CAMPO}`}>
          <g transform={`translate(0, ${ANCHO_CAMPO}) rotate(-90)`}>
            <PitchOutlineSvg />
            {accionesVisibles.map((accion) => (
              <circle
                className="stats-pitch-map-punto"
                cx={(normalizarX(accion) / 100) * ANCHO_CAMPO}
                cy={(accion.y / 100) * ALTO_CAMPO}
                fill={accion.categoria === 'positiva' ? COLOR_POSITIVA : COLOR_NEGATIVA}
                key={accion.id}
                r="1.3"
                stroke="#0d1113"
                strokeWidth="0.25"
                onMouseEnter={(evento) => mostrarHover(evento, accion.minuto)}
                onMouseLeave={() => setPuntoHover(null)}
                onMouseMove={(evento) => mostrarHover(evento, accion.minuto)}
              />
            ))}
          </g>
        </svg>

        {puntoHover && (
          <div
            className="stats-pitch-map-tooltip"
            style={{ left: puntoHover.left, top: puntoHover.top }}
          >
            Minuto {puntoHover.minuto}&apos;
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerActionsPitchMap
