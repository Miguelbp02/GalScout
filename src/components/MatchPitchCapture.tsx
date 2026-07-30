import { useEffect, useRef, useState } from 'react'
import { obtenerEtiquetasAccion } from '../services/actionTagService'
import { useMatchSession } from './MatchSessionContext'
import type { EtiquetaAccion } from '../types/accionObservacion'

function MatchPitchCapture() {
  const { sesion, agregarAccion, cambiarLadoEquipoA } = useMatchSession()
  const campoRef = useRef<HTMLDivElement>(null)
  const [etiquetasCampo, setEtiquetasCampo] = useState<EtiquetaAccion[]>([])
  const [etiquetasPortero, setEtiquetasPortero] = useState<EtiquetaAccion[]>([])
  const [toque, setToque] = useState<{ x: number; y: number } | null>(null)
  const [etiquetaElegida, setEtiquetaElegida] = useState<EtiquetaAccion | null>(null)

  const hayPortero = sesion?.jugadores.some(
    (jugador) => jugador.perfilScouting === 'portero',
  )

  useEffect(() => {
    obtenerEtiquetasAccion('campo')
      .then(setEtiquetasCampo)
      .catch(() => setEtiquetasCampo([]))
  }, [])

  useEffect(() => {
    if (!hayPortero) return

    obtenerEtiquetasAccion('portero')
      .then(setEtiquetasPortero)
      .catch(() => setEtiquetasPortero([]))
  }, [hayPortero])

  if (!sesion) return null

  const capturaActiva =
    (sesion.estado === 'primera_parte' || sesion.estado === 'segunda_parte') &&
    sesion.corriendo
  const minutoActual = Math.floor(sesion.segundos / 60)
  const equipoIzquierda =
    sesion.ladoEquipoA === 'izquierda' ? sesion.nombreEquipoA : sesion.nombreEquipoB
  const equipoDerecha =
    sesion.ladoEquipoA === 'izquierda' ? sesion.nombreEquipoB : sesion.nombreEquipoA

  function manejarClicCampo(evento: React.MouseEvent<HTMLDivElement>) {
    if (!capturaActiva || !campoRef.current) return

    const rect = campoRef.current.getBoundingClientRect()
    const x = ((evento.clientX - rect.left) / rect.width) * 100
    const y = ((evento.clientY - rect.top) / rect.height) * 100

    setToque({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) })
    setEtiquetaElegida(null)
  }

  function elegirEtiqueta(etiqueta: EtiquetaAccion) {
    if (!toque) return
    setEtiquetaElegida(etiqueta)
  }

  function elegirJugador(jugadorId: string) {
    if (!toque || !etiquetaElegida) return

    agregarAccion({
      jugadorId,
      etiquetaId: etiquetaElegida.id,
      etiquetaNombre: etiquetaElegida.nombre,
      minuto: minutoActual,
      x: Number(toque.x.toFixed(2)),
      y: Number(toque.y.toFixed(2)),
      notaLibre: '',
    })

    setToque(null)
    setEtiquetaElegida(null)
  }

  const estadoTexto = !capturaActiva
    ? 'El campo se activa mientras el cronómetro está en marcha'
    : !toque
      ? 'Toca el campo para registrar el punto de la acción'
      : !etiquetaElegida
        ? `Minuto ${minutoActual}' — elige la etiqueta`
        : `¿Quién ha hecho "${etiquetaElegida.nombre}"?`

  return (
    <div className="match-pitch-panel">
      <div className="match-side-header">
        <span className="match-side-team">{equipoIzquierda}</span>
        <button
          aria-label="Cambiar de lado"
          className="match-icon-button"
          disabled={sesion.jugadores.length < 2}
          title="Corrige el lado si os equivocasteis al asignar"
          type="button"
          onClick={cambiarLadoEquipoA}
        >
          ⇄
        </button>
        <span className="match-side-team match-side-team--derecha">{equipoDerecha}</span>
      </div>

      <p className="match-estado-texto">{estadoTexto}</p>

      <div className="match-tag-grid">
        {etiquetasCampo.map((etiqueta) => (
          <button
            className={`match-tag-chip match-tag-chip--${etiqueta.categoria}`}
            disabled={!toque}
            key={etiqueta.id}
            type="button"
            onClick={() => elegirEtiqueta(etiqueta)}
          >
            {etiqueta.nombre}
          </button>
        ))}
      </div>

      {etiquetasPortero.length > 0 && (
        <details className="match-tag-portero">
          <summary>Acciones de portero ▾</summary>
          <div className="match-tag-grid mt-2">
            {etiquetasPortero.map((etiqueta) => (
              <button
                className={`match-tag-chip match-tag-chip--${etiqueta.categoria}`}
                disabled={!toque}
                key={etiqueta.id}
                type="button"
                onClick={() => elegirEtiqueta(etiqueta)}
              >
                {etiqueta.nombre}
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="match-player-grid">
        {sesion.jugadores.map((jugador) => (
          <button
            className="match-player-chip"
            disabled={!etiquetaElegida}
            key={jugador.id}
            style={{ borderColor: jugador.color, color: jugador.color }}
            type="button"
            onClick={() => elegirJugador(jugador.id)}
          >
            {jugador.nombre}
          </button>
        ))}
      </div>

      <div
        className={`match-pitch-field ${capturaActiva ? '' : 'match-pitch-field--inactivo'}`}
        ref={campoRef}
        onClick={manejarClicCampo}
      >
        <svg className="match-pitch-svg" viewBox="0 0 105 68">
          <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.35">
            <rect height="68" width="105" x="0" y="0" />
            <line x1="52.5" x2="52.5" y1="0" y2="68" />
            <circle cx="52.5" cy="34" r="9.15" />
            <rect height="40.32" width="16.5" x="0" y="13.84" />
            <rect height="18.32" width="5.5" x="0" y="24.84" />
            <path d="M 16.5 24.85 A 9.15 9.15 0 0 1 16.5 43.15" />
            <rect height="40.32" width="16.5" x="88.5" y="13.84" />
            <rect height="18.32" width="5.5" x="99.5" y="24.84" />
            <path d="M 88.5 43.15 A 9.15 9.15 0 0 1 88.5 24.85" />
          </g>
          <g fill="rgba(255,255,255,0.85)">
            <circle cx="52.5" cy="34" r="0.45" />
            <circle cx="11" cy="34" r="0.45" />
            <circle cx="94" cy="34" r="0.45" />
          </g>
          {sesion.acciones.map((accion) => {
            const jugador = sesion.jugadores.find((item) => item.id === accion.jugadorId)
            if (!jugador) return null

            return (
              <circle
                cx={(accion.x / 100) * 105}
                cy={(accion.y / 100) * 68}
                fill={jugador.color}
                key={accion.id}
                r="1.2"
                stroke="#0d1113"
                strokeWidth="0.25"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default MatchPitchCapture
