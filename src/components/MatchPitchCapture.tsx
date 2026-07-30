import { useEffect, useRef, useState } from 'react'
import { obtenerEtiquetasAccion } from '../services/actionTagService'
import { useMatchSession } from './MatchSessionContext'
import type { EtiquetaAccion } from '../types/accionObservacion'
import type { EquipoSesion } from '../types/matchSession'

function MatchPitchCapture() {
  const { sesion, agregarAccion, cambiarLadoEquipoA } = useMatchSession()
  const campoRef = useRef<HTMLDivElement>(null)
  const [etiquetasCampo, setEtiquetasCampo] = useState<EtiquetaAccion[]>([])
  const [etiquetasPortero, setEtiquetasPortero] = useState<EtiquetaAccion[]>([])
  const [toque, setToque] = useState<{ x: number; y: number } | null>(null)
  const [etiquetaElegida, setEtiquetaElegida] = useState<EtiquetaAccion | null>(null)
  const [sustitucionAbierta, setSustitucionAbierta] = useState(false)
  const [errorEtiquetas, setErrorEtiquetas] = useState(false)

  const hayPortero = sesion?.jugadores.some(
    (jugador) => jugador.perfilScouting === 'portero',
  )

  useEffect(() => {
    obtenerEtiquetasAccion('campo')
      .then((etiquetas) => {
        setEtiquetasCampo(etiquetas)
        setErrorEtiquetas(false)
      })
      .catch(() => {
        setEtiquetasCampo([])
        setErrorEtiquetas(true)
      })
  }, [])

  useEffect(() => {
    if (!hayPortero) return

    obtenerEtiquetasAccion('portero')
      .then((etiquetas) => {
        setEtiquetasPortero(etiquetas)
        setErrorEtiquetas(false)
      })
      .catch(() => {
        setEtiquetasPortero([])
        setErrorEtiquetas(true)
      })
  }, [hayPortero])

  if (!sesion) return null

  const capturaActiva =
    (sesion.estado === 'primera_parte' || sesion.estado === 'segunda_parte') &&
    sesion.corriendo
  const minutoActual = Math.floor(sesion.segundos / 60)
  const equipoIzquierdaCodigo: EquipoSesion =
    sesion.ladoEquipoA === 'izquierda' ? 'A' : 'B'
  const equipoIzquierda =
    sesion.ladoEquipoA === 'izquierda' ? sesion.nombreEquipoA : sesion.nombreEquipoB
  const equipoDerecha =
    sesion.ladoEquipoA === 'izquierda' ? sesion.nombreEquipoB : sesion.nombreEquipoA
  const jugadoresIzquierda = sesion.jugadores.filter(
    (jugador) => jugador.equipo === equipoIzquierdaCodigo,
  )
  const jugadoresDerecha = sesion.jugadores.filter(
    (jugador) => jugador.equipo !== equipoIzquierdaCodigo,
  )
  const etiquetasCampoNormales = etiquetasCampo.filter((etiqueta) => !etiqueta.esSustitucion)
  const etiquetaEntra = etiquetasCampo.find(
    (etiqueta) => etiqueta.esSustitucion && etiqueta.nombre === 'Entra al campo',
  )
  const etiquetaSale = etiquetasCampo.find(
    (etiqueta) => etiqueta.esSustitucion && etiqueta.nombre === 'Sale del campo',
  )

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
      esSustitucion: false,
      minuto: minutoActual,
      x: Number(toque.x.toFixed(2)),
      y: Number(toque.y.toFixed(2)),
      notaLibre: '',
    })

    setToque(null)
    setEtiquetaElegida(null)
  }

  function registrarSustitucion(jugadorId: string, etiqueta: EtiquetaAccion) {
    agregarAccion({
      jugadorId,
      etiquetaId: etiqueta.id,
      etiquetaNombre: etiqueta.nombre,
      esSustitucion: true,
      minuto: minutoActual,
      x: 50,
      y: 50,
      notaLibre: '',
    })

    setSustitucionAbierta(false)
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

      {errorEtiquetas && (
        <p className="alert alert-danger py-2 small mb-2" role="alert">
          No se han podido cargar las etiquetas de acción. Puede que falte ejecutar la
          migración 014_sustituciones.sql en Supabase. Recarga la página tras
          comprobarlo.
        </p>
      )}

      <div className="match-tag-grid">
        {etiquetasCampoNormales.map((etiqueta) => (
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
        <div className="match-player-group">
          {jugadoresIzquierda.map((jugador) => (
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

        <div className="match-sustitucion">
          {etiquetaEntra && etiquetaSale && (
            <>
              <button
                className="match-sustitucion-trigger"
                disabled={!capturaActiva}
                type="button"
                onClick={() => setSustitucionAbierta((actual) => !actual)}
              >
                ⇅ Sustitución
              </button>

              {sustitucionAbierta && (
                <div className="match-sustitucion-panel">
                  {sesion.jugadores.map((jugador) => (
                    <div className="match-sustitucion-fila" key={jugador.id}>
                      <span style={{ color: jugador.color }}>{jugador.nombre}</span>
                      <span className="d-flex gap-1">
                        <button
                          aria-label={`${jugador.nombre} entra al campo`}
                          className="match-sustitucion-boton match-sustitucion-boton--entra"
                          title="Entra al campo"
                          type="button"
                          onClick={() => registrarSustitucion(jugador.id, etiquetaEntra)}
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`${jugador.nombre} sale del campo`}
                          className="match-sustitucion-boton match-sustitucion-boton--sale"
                          title="Sale del campo"
                          type="button"
                          onClick={() => registrarSustitucion(jugador.id, etiquetaSale)}
                        >
                          ↓
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="match-player-group match-player-group--derecha">
          {jugadoresDerecha.map((jugador) => (
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
          {sesion.acciones
            .filter((accion) => accion.parte === sesion.parte && !accion.esSustitucion)
            .map((accion) => {
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
          {toque && (
            <circle
              cx={(toque.x / 100) * 105}
              cy={(toque.y / 100) * 68}
              fill="#c3cad1"
              r="1.4"
              stroke="#fff"
              strokeWidth="0.3"
            />
          )}
        </svg>
      </div>
    </div>
  )
}

export default MatchPitchCapture
