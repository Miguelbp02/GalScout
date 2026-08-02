import { useEffect, useRef, useState } from 'react'
import { obtenerEtiquetasAccion } from '../services/actionTagService'
import PitchOutlineSvg, { ALTO_CAMPO, ANCHO_CAMPO } from './PitchOutlineSvg'
import { useMatchSession } from './MatchSessionContext'
import type { EtiquetaAccion } from '../types/accionObservacion'
import type { EquipoSesion, JugadorSeguido } from '../types/matchSession'

const CONSULTA_MOVIL = '(max-width: 900px)'

interface Toque {
  x: number
  y: number
  minuto: number
}

function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA_MOVIL).matches,
  )

  useEffect(() => {
    const medio = window.matchMedia(CONSULTA_MOVIL)
    const manejar = (evento: MediaQueryListEvent) => setEsMovil(evento.matches)
    medio.addEventListener('change', manejar)
    return () => medio.removeEventListener('change', manejar)
  }, [])

  return esMovil
}

interface MatchPitchCaptureProps {
  onSelectorAbiertoChange?: (abierto: boolean) => void
}

function MatchPitchCapture({ onSelectorAbiertoChange }: MatchPitchCaptureProps) {
  const { sesion, agregarAccion, cambiarLadoEquipoA } = useMatchSession()
  const campoSvgRef = useRef<SVGSVGElement>(null)
  const arrastrandoRef = useRef(false)
  const esMovil = useEsMovil()
  const [etiquetasCampo, setEtiquetasCampo] = useState<EtiquetaAccion[]>([])
  const [etiquetasPortero, setEtiquetasPortero] = useState<EtiquetaAccion[]>([])
  const [toque, setToque] = useState<Toque | null>(null)
  const [puntoPrevia, setPuntoPrevia] = useState<{ x: number; y: number } | null>(null)
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

  useEffect(() => {
    onSelectorAbiertoChange?.(toque !== null)
  }, [toque, onSelectorAbiertoChange])

  if (!sesion) return null

  const unicoJugador = sesion.jugadores.length === 1 ? sesion.jugadores[0] : null
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

  function calcularPunto(evento: { clientX: number; clientY: number }) {
    if (!campoSvgRef.current) return null

    const matrizCampo = campoSvgRef.current.getScreenCTM()
    if (!matrizCampo) return null

    const puntoPantalla = campoSvgRef.current.createSVGPoint()
    puntoPantalla.x = evento.clientX
    puntoPantalla.y = evento.clientY
    const puntoCampo = puntoPantalla.matrixTransform(matrizCampo.inverse())
    const x = (puntoCampo.x / ANCHO_CAMPO) * 100
    const y = (puntoCampo.y / ALTO_CAMPO) * 100

    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
  }

  function manejarPointerDown(evento: React.PointerEvent<HTMLDivElement>) {
    if (!capturaActiva) return

    if (toque && esMovil) {
      setToque(null)
      setEtiquetaElegida(null)
      return
    }

    const punto = calcularPunto(evento)
    if (!punto) return

    if (toque) {
      setToque(null)
      setEtiquetaElegida(null)
    }

    evento.currentTarget.setPointerCapture(evento.pointerId)
    arrastrandoRef.current = true
    setPuntoPrevia(punto)
  }

  function manejarPointerMove(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrandoRef.current) return

    const punto = calcularPunto(evento)
    if (!punto) return

    setPuntoPrevia(punto)
  }

  function finalizarArrastre(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrandoRef.current) return

    arrastrandoRef.current = false

    setPuntoPrevia((puntoActual) => {
      if (puntoActual) {
        setToque({ x: puntoActual.x, y: puntoActual.y, minuto: minutoActual })
        setEtiquetaElegida(null)
      }
      return null
    })

    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId)
    }
  }

  function elegirEtiqueta(etiqueta: EtiquetaAccion) {
    if (!toque) return

    if (unicoJugador) {
      registrarAccion(unicoJugador.id, etiqueta)
      return
    }

    setEtiquetaElegida(etiqueta)
  }

  function registrarAccion(jugadorId: string, etiqueta: EtiquetaAccion) {
    if (!toque) return

    agregarAccion({
      jugadorId,
      etiquetaId: etiqueta.id,
      etiquetaNombre: etiqueta.nombre,
      esSustitucion: false,
      minuto: toque.minuto,
      x: Number(toque.x.toFixed(2)),
      y: Number(toque.y.toFixed(2)),
      notaLibre: '',
    })

    setToque(null)
    setEtiquetaElegida(null)
  }

  function elegirJugador(jugadorId: string) {
    if (!etiquetaElegida) return
    registrarAccion(jugadorId, etiquetaElegida)
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
      ? 'Mantén pulsado el campo para registrar el punto de la acción'
      : !etiquetaElegida
        ? `Minuto ${toque.minuto}' — elige la etiqueta`
        : `¿Quién ha hecho "${etiquetaElegida.nombre}"?`

  function renderEtiquetas(lista: EtiquetaAccion[], claseExtra = '') {
    return (
      <div className={`match-tag-grid ${claseExtra}`}>
        {lista.map((etiqueta) => (
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
    )
  }

  function renderPortero() {
    if (etiquetasPortero.length === 0) return null

    return (
      <details className="match-tag-portero">
        <summary>Acciones de portero ▾</summary>
        {renderEtiquetas(etiquetasPortero, 'mt-2')}
      </details>
    )
  }

  function renderGrupoJugadores(jugadores: JugadorSeguido[], claseExtra = '') {
    return (
      <div className={`match-player-group ${claseExtra}`}>
        {jugadores.map((jugador) => (
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
    )
  }

  function renderSustitucion() {
    if (!etiquetaEntra || !etiquetaSale) return null

    return (
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
            {sesion!.jugadores.map((jugador) => (
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
    )
  }

  const puntoMostrado = puntoPrevia ?? toque

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
        <div className="match-sustitucion match-sustitucion--movil">{renderSustitucion()}</div>
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

      {renderEtiquetas(etiquetasCampoNormales)}
      {renderPortero()}

      <div className="match-player-grid">
        {renderGrupoJugadores(jugadoresIzquierda)}

        <div className="match-sustitucion">{renderSustitucion()}</div>

        {renderGrupoJugadores(jugadoresDerecha, 'match-player-group--derecha')}
      </div>

      <div className="match-pitch-field-area">
        <div
          className={`match-pitch-field ${capturaActiva ? '' : 'match-pitch-field--inactivo'}`}
          onPointerCancel={finalizarArrastre}
          onPointerDown={manejarPointerDown}
          onPointerMove={manejarPointerMove}
          onPointerUp={finalizarArrastre}
        >
          <svg
            className="match-pitch-svg"
            ref={campoSvgRef}
            viewBox={`0 0 ${ANCHO_CAMPO} ${ALTO_CAMPO}`}
          >
            <PitchOutlineSvg />
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
            {puntoMostrado && (
              <circle
                cx={(puntoMostrado.x / 100) * 105}
                cy={(puntoMostrado.y / 100) * 68}
                fill="#c3cad1"
                r={puntoPrevia ? '1.6' : '1.4'}
                stroke="#fff"
                strokeWidth="0.3"
              />
            )}
          </svg>
        </div>

        <div className={`match-pitch-selector ${toque ? 'match-pitch-selector--abierta' : ''}`}>
          {renderEtiquetas(etiquetasCampoNormales)}
          {renderPortero()}
          <div className="match-player-grid match-player-grid--selector">
            {renderGrupoJugadores(jugadoresIzquierda)}
            {renderGrupoJugadores(jugadoresDerecha, 'match-player-group--derecha')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchPitchCapture
