import { useEffect, useMemo, useState } from 'react'
import playerPlaceholder from '../assets/player-placeholder.png'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import PlayerComparisonBars from '../components/PlayerComparisonBars'
import PlayerComparisonRadar from '../components/PlayerComparisonRadar'
import PositionFieldSelector from '../components/PositionFieldSelector'
import { obtenerValoracionesMediasJugador } from '../services/playerRatingsService'
import { obtenerJugadores } from '../services/playerService'
import { obtenerPosiciones } from '../services/positionService'
import type { PerfilScouting, ResumenValoracionCriterio } from '../types/criterio'
import type { Jugador } from '../types/jugador'
import type { Posicion } from '../types/posicion'

function ComparePlayersPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [idJugadorA, setIdJugadorA] = useState('')
  const [idJugadorB, setIdJugadorB] = useState('')
  const [valoracionesA, setValoracionesA] = useState<ResumenValoracionCriterio[]>([])
  const [valoracionesB, setValoracionesB] = useState<ResumenValoracionCriterio[]>([])
  const [valoracionesCargando, setValoracionesCargando] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      setError(null)

      try {
        const [jugadoresObtenidos, posicionesObtenidas] = await Promise.all([
          obtenerJugadores(),
          obtenerPosiciones(),
        ])
        setJugadores(jugadoresObtenidos)
        setPosiciones(posicionesObtenidas)
      } catch {
        setError('No se han podido cargar los jugadores.')
      } finally {
        setCargando(false)
      }
    }

    void cargarDatos()
  }, [])

  const posicionPorteroId = useMemo(
    () => posiciones.find((posicion) => posicion.codigo === 'portero')?.id,
    [posiciones],
  )

  function perfilDeJugador(jugador: Jugador): PerfilScouting {
    return posicionPorteroId !== undefined &&
      jugador.posicionesNaturalesIds.includes(posicionPorteroId)
      ? 'portero'
      : 'campo'
  }

  const jugadorA = jugadores.find((jugador) => jugador.id === idJugadorA) ?? null
  const jugadorB = jugadores.find((jugador) => jugador.id === idJugadorB) ?? null

  function opcionesPara(idExcluido: string, jugadorReferencia: Jugador | null) {
    return jugadores
      .filter((jugador) => jugador.id !== idExcluido)
      .filter(
        (jugador) =>
          !jugadorReferencia ||
          perfilDeJugador(jugador) === perfilDeJugador(jugadorReferencia),
      )
      .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'))
  }

  const opcionesA = opcionesPara(idJugadorB, jugadorB)
  const opcionesB = opcionesPara(idJugadorA, jugadorA)

  const perfilScouting = jugadorA
    ? perfilDeJugador(jugadorA)
    : jugadorB
      ? perfilDeJugador(jugadorB)
      : null

  useEffect(() => {
    if (!jugadorA || !jugadorB || !perfilScouting) return

    let cancelado = false

    async function cargarValoraciones() {
      setValoracionesCargando(true)

      try {
        const [mediasA, mediasB] = await Promise.all([
          obtenerValoracionesMediasJugador(jugadorA!.id, perfilScouting!),
          obtenerValoracionesMediasJugador(jugadorB!.id, perfilScouting!),
        ])

        if (cancelado) return
        setValoracionesA(mediasA)
        setValoracionesB(mediasB)
      } catch {
        if (cancelado) return
        setValoracionesA([])
        setValoracionesB([])
      } finally {
        if (!cancelado) setValoracionesCargando(false)
      }
    }

    void cargarValoraciones()

    return () => {
      cancelado = true
    }
  }, [jugadorA, jugadorB, perfilScouting])

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="mt-4">
        <h2 className="h3 mb-1">Comparar jugadores</h2>
        <p className="text-body-secondary mb-4">
          Elige dos jugadores del mismo perfil (de campo o porteros) para comparar sus
          valoraciones medias.
        </p>

        {cargando && <p className="text-body-secondary">Cargando jugadores…</p>}

        {error && (
          <p className="alert alert-danger" role="alert">
            {error}
          </p>
        )}

        {!cargando && !error && (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="comparar-jugador-a">
                Jugador 1
              </label>
              <select
                className="form-select"
                id="comparar-jugador-a"
                value={idJugadorA}
                onChange={(evento) => setIdJugadorA(evento.target.value)}
              >
                <option value="">Selecciona un jugador</option>
                {opcionesA.map((jugador) => (
                  <option key={jugador.id} value={jugador.id}>
                    {jugador.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="comparar-jugador-b">
                Jugador 2
              </label>
              <select
                className="form-select"
                id="comparar-jugador-b"
                value={idJugadorB}
                onChange={(evento) => setIdJugadorB(evento.target.value)}
              >
                <option value="">Selecciona un jugador</option>
                {opcionesB.map((jugador) => (
                  <option key={jugador.id} value={jugador.id}>
                    {jugador.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {jugadorA && jugadorB && perfilScouting && (
          <section className="card comparison-card shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="comparison-header">
                <div className="comparison-identity comparison-identity--a">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="comparison-avatar"
                    src={playerPlaceholder}
                  />
                  <div>
                    <span className="comparison-side-label">Jugador 1</span>
                    <h3 className="h5 mb-1">{jugadorA.nombre}</h3>
                    <p className="comparison-side-meta mb-0">
                      {jugadorA.edad} años · {jugadorA.alturaCm} cm
                    </p>
                    {jugadorA.equipoActual && (
                      <p className="comparison-side-team mb-0">{jugadorA.equipoActual}</p>
                    )}
                  </div>
                </div>
                <span aria-hidden="true" className="comparison-versus">
                  VS
                </span>
                <div className="comparison-identity comparison-identity--b">
                  <div>
                    <span className="comparison-side-label">Jugador 2</span>
                    <h3 className="h5 mb-1">{jugadorB.nombre}</h3>
                    <p className="comparison-side-meta mb-0">
                      {jugadorB.edad} años · {jugadorB.alturaCm} cm
                    </p>
                    {jugadorB.equipoActual && (
                      <p className="comparison-side-team mb-0">{jugadorB.equipoActual}</p>
                    )}
                  </div>
                  <img
                    alt=""
                    aria-hidden="true"
                    className="comparison-avatar"
                    src={playerPlaceholder}
                  />
                </div>
              </div>

              {valoracionesCargando ? (
                <p className="text-body-secondary text-center mt-4 mb-0">
                  Cargando valoraciones…
                </p>
              ) : (
                <>
                  <div className="comparison-profile-row">
                    <div className="comparison-side-position">
                      <PositionFieldSelector
                        disabled
                        etiquetas="ninguna"
                        modo="resumen"
                        mostrarLeyendaResumen={false}
                        posiciones={posiciones}
                        posicionesAptasIds={jugadorA.posicionesAptasIds}
                        posicionesNaturalesIds={jugadorA.posicionesNaturalesIds}
                      />
                    </div>
                    <PlayerComparisonRadar
                      nombreA={jugadorA.nombre}
                      nombreB={jugadorB.nombre}
                      perfilScouting={perfilScouting}
                      valoracionesA={valoracionesA}
                      valoracionesB={valoracionesB}
                    />
                    <div className="comparison-side-position">
                      <PositionFieldSelector
                        disabled
                        etiquetas="ninguna"
                        modo="resumen"
                        mostrarLeyendaResumen={false}
                        posiciones={posiciones}
                        posicionesAptasIds={jugadorB.posicionesAptasIds}
                        posicionesNaturalesIds={jugadorB.posicionesNaturalesIds}
                      />
                    </div>
                  </div>
                  <PlayerComparisonBars
                    nombreA={jugadorA.nombre}
                    nombreB={jugadorB.nombre}
                    valoracionesA={valoracionesA}
                    valoracionesB={valoracionesB}
                  />
                </>
              )}
            </div>
          </section>
        )}
      </div>

      <AppFooter />
    </main>
  )
}

export default ComparePlayersPage
