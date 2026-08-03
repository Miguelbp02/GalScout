import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import playerPlaceholder from '../assets/player-placeholder.png'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import PlayerAverageRatings from '../components/PlayerAverageRatings'
import PlayerProfileRadar from '../components/PlayerProfileRadar'
import GeneralRatingForm from '../components/GeneralRatingForm'
import GeneralRatingList from '../components/GeneralRatingList'
import PlayerDetailSkeleton from '../components/PlayerDetailSkeleton'
import PlayerObservationForm from '../components/PlayerObservationForm'
import PlayerObservationList from '../components/PlayerObservationList'
import PlayerStatsTab from '../components/PlayerStatsTab'
import PlayerExportTab from '../components/PlayerExportTab'
import PositionFieldSelector from '../components/PositionFieldSelector'
import DominantFootIndicator from '../components/DominantFootIndicator'
import JerseyNumberBadge from '../components/JerseyNumberBadge'
import TeamHistoryList from '../components/TeamHistoryList'
import { obtenerAbreviaturaPosicion } from '../constants/positionAbbreviations'
import {
  actualizarObservacionJugador,
  crearObservacionJugador,
  eliminarObservaciones,
  obtenerObservacionesJugador,
} from '../services/observationService'
import { obtenerJugadorPorId } from '../services/playerService'
import {
  obtenerPerfilPosicionalJugador,
  obtenerPosiciones,
} from '../services/positionService'
import {
  crearValoracionGeneral,
  eliminarValoracionesGenerales,
  obtenerValoracionesGeneralesJugador,
} from '../services/generalRatingService'
import {
  eliminarHistorialEquipos,
  obtenerHistorialEquiposJugador,
} from '../services/teamHistoryService'
import type { Jugador } from '../types/jugador'
import type { PerfilScouting } from '../types/criterio'
import type { Posicion } from '../types/posicion'
import type {
  NuevaObservacion,
  ObservacionJugador,
} from '../types/observacion'
import type {
  NuevaValoracionGeneral,
  ValoracionGeneral,
} from '../types/valoracionGeneral'
import type { HistorialEquipoJugador } from '../types/historialEquipo'

type PestanaFicha = 'general' | 'historial' | 'estadisticas' | 'exportar'

function PlayerDetailPage() {
  const { jugadorId } = useParams()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState<ObservacionJugador[]>([])
  const [observacionesCargando, setObservacionesCargando] = useState(false)
  const [errorObservaciones, setErrorObservaciones] = useState<string | null>(null)
  const [versionValoraciones, setVersionValoraciones] = useState(0)
  const [valoracionesGenerales, setValoracionesGenerales] = useState<ValoracionGeneral[]>([])
  const [valoracionesGeneralesCargando, setValoracionesGeneralesCargando] = useState(false)
  const [errorValoracionesGenerales, setErrorValoracionesGenerales] = useState<string | null>(null)
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [posicionesNaturalesIds, setPosicionesNaturalesIds] = useState<number[]>([])
  const [posicionesAptasIds, setPosicionesAptasIds] = useState<number[]>([])
  const [perfilPosicionalCargado, setPerfilPosicionalCargado] = useState(false)
  const [alturaFormularioObservacion, setAlturaFormularioObservacion] = useState(0)
  const [pestanaFicha, setPestanaFicha] = useState<PestanaFicha>('general')
  const [historialEquipos, setHistorialEquipos] = useState<HistorialEquipoJugador[]>([])
  const [historialCargando, setHistorialCargando] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)

  const perfilScouting: PerfilScouting = posiciones.some(
    (posicion) =>
      posicion.codigo === 'portero' &&
      posicionesNaturalesIds.includes(posicion.id),
  )
    ? 'portero'
    : 'campo'

  const posicionesNaturalesJugador = posiciones.filter((posicion) =>
    posicionesNaturalesIds.includes(posicion.id),
  )

  useEffect(() => {
    const id = jugadorId ?? ''
    if (!id) return

    async function cargarJugador() {
      setCargando(true)
      setError(null)

      try {
        const jugadorObtenido = await obtenerJugadorPorId(id)

        if (!jugadorObtenido) {
          setError('No se ha encontrado el jugador solicitado.')
          return
        }

        setJugador(jugadorObtenido)
      } catch {
        setError('No se ha podido cargar la ficha del jugador.')
      } finally {
        setCargando(false)
      }
    }

    void cargarJugador()
  }, [jugadorId])

  useEffect(() => {
    const id = jugador?.id
    if (!id) return

    const jugadorIdParaObservaciones = id

    async function cargarObservaciones() {
      setObservacionesCargando(true)
      setErrorObservaciones(null)

      try {
        const observacionesObtenidas = await obtenerObservacionesJugador(
          jugadorIdParaObservaciones,
        )
        setObservaciones(observacionesObtenidas)
      } catch {
        setErrorObservaciones('No se han podido cargar las observaciones.')
      } finally {
        setObservacionesCargando(false)
      }
    }

    void cargarObservaciones()
  }, [jugador?.id])

  useEffect(() => {
    const id = jugador?.id
    if (!id) return

    const jugadorIdParaValoraciones = id

    async function cargarValoracionesGenerales() {
      setValoracionesGeneralesCargando(true)
      setErrorValoracionesGenerales(null)

      try {
        const valoraciones = await obtenerValoracionesGeneralesJugador(
          jugadorIdParaValoraciones,
        )
        setValoracionesGenerales(valoraciones)
      } catch {
        setErrorValoracionesGenerales(
          'No se han podido cargar los informes generales.',
        )
      } finally {
        setValoracionesGeneralesCargando(false)
      }
    }

    void cargarValoracionesGenerales()
  }, [jugador?.id])

  useEffect(() => {
    const id = jugador?.id
    if (!id) return

    const jugadorIdParaPerfilPosicional = id

    async function cargarPerfilPosicional() {
      setPerfilPosicionalCargado(false)

      try {
        const [catalogoPosiciones, perfilPosicional] = await Promise.all([
          obtenerPosiciones(),
          obtenerPerfilPosicionalJugador(jugadorIdParaPerfilPosicional),
        ])

        setPosiciones(catalogoPosiciones)
        setPosicionesNaturalesIds(perfilPosicional.posicionesNaturalesIds)
        setPosicionesAptasIds(perfilPosicional.posicionesAptasIds)
      } catch {
        setPosiciones([])
        setPosicionesNaturalesIds([])
        setPosicionesAptasIds([])
      } finally {
        setPerfilPosicionalCargado(true)
      }
    }

    void cargarPerfilPosicional()
  }, [jugador?.id])

  useEffect(() => {
    const id = jugador?.id
    if (!id) return

    const jugadorIdParaHistorial = id

    async function cargarHistorial() {
      setHistorialCargando(true)
      setErrorHistorial(null)

      try {
        const historialObtenido = await obtenerHistorialEquiposJugador(
          jugadorIdParaHistorial,
        )
        setHistorialEquipos(historialObtenido)
      } catch {
        setErrorHistorial('No se ha podido cargar el historial de equipos.')
      } finally {
        setHistorialCargando(false)
      }
    }

    void cargarHistorial()
  }, [jugador?.id])

  async function añadirObservacion(observacion: NuevaObservacion) {
    if (!jugador) return

    await crearObservacionJugador(jugador.id, observacion)
    const observacionesActualizadas = await obtenerObservacionesJugador(jugador.id)
    setObservaciones(observacionesActualizadas)
    setVersionValoraciones((versionActual) => versionActual + 1)
  }

  async function añadirValoracionGeneral(valoracion: NuevaValoracionGeneral) {
    if (!jugador) return

    await crearValoracionGeneral(jugador.id, valoracion)
    const valoracionesActualizadas = await obtenerValoracionesGeneralesJugador(jugador.id)
    setValoracionesGenerales(valoracionesActualizadas)
  }

  async function eliminarObservacionesSeleccionadas(ids: string[]) {
    if (!jugador) return

    await eliminarObservaciones(ids)
    setObservaciones(await obtenerObservacionesJugador(jugador.id))
    setVersionValoraciones((versionActual) => versionActual + 1)
  }

  async function actualizarObservacionSeleccionada(
    id: string,
    observacion: NuevaObservacion,
  ) {
    if (!jugador) return

    await actualizarObservacionJugador(id, observacion)
    setObservaciones(await obtenerObservacionesJugador(jugador.id))
    setVersionValoraciones((versionActual) => versionActual + 1)
  }

  async function eliminarValoracionesGeneralesSeleccionadas(ids: string[]) {
    if (!jugador) return

    await eliminarValoracionesGenerales(ids)
    setValoracionesGenerales(await obtenerValoracionesGeneralesJugador(jugador.id))
  }

  async function eliminarHistorialEquiposSeleccionados(ids: string[]) {
    if (!jugador) return

    await eliminarHistorialEquipos(ids)
    setHistorialEquipos(await obtenerHistorialEquiposJugador(jugador.id))
  }

  const errorVisible = jugadorId
    ? error
    : 'No se ha recibido un identificador de jugador válido.'

  return (
    <main className="app-shell player-detail-shell">
      <AppHeader
        className="player-detail-header"
        mostrarNavegacion={false}
        acciones={
          <div className="d-flex flex-wrap justify-content-end gap-2">
            <Link className="btn btn-primary" to={`/jugadores/${jugadorId}/editar`}>
              Editar jugador
            </Link>
            <Link className="btn btn-outline-secondary" to="/">
              Volver a jugadores
            </Link>
          </div>
        }
      />

      {cargando && jugadorId && <PlayerDetailSkeleton />}

      {errorVisible && (
        <section className="alert alert-danger mt-5" role="alert">
          {errorVisible}
        </section>
      )}

      {jugador && !cargando && !errorVisible && (
        <>
          <section
            className={`card player-detail-summary player-detail-summary--${pestanaFicha} mt-4 shadow-sm`}
          >
            <div className="card-body p-3">
              <div className="player-detail-tabs">
                <nav
                  aria-label="Secciones de la ficha del jugador"
                  className="player-detail-tabs-lista"
                  role="tablist"
                >
                  {(
                    [
                      ['general', 'General'],
                      ['historial', 'Historial'],
                      ['estadisticas', 'Estadísticas'],
                      ['exportar', 'Exportar'],
                    ] as const
                  ).map(([pestana, etiqueta]) => (
                    <button
                      aria-selected={pestanaFicha === pestana}
                      className={`player-detail-tab ${
                        pestanaFicha === pestana ? 'active' : ''
                      }`}
                      key={pestana}
                      role="tab"
                      type="button"
                      onClick={() => setPestanaFicha(pestana)}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </nav>

                <div
                  className="player-detail-indice"
                  title={`${jugador.nombre} — jugador de esta ficha`}
                >
                  <span className="player-detail-indice-nombre">{jugador.nombre}</span>
                  {posicionesNaturalesJugador.length > 0 && (
                    <span className="player-detail-indice-posiciones">
                      {posicionesNaturalesJugador.map((posicion) => (
                        <span
                          className="player-card-position-tag player-card-position-tag--natural"
                          key={posicion.id}
                        >
                          {obtenerAbreviaturaPosicion(posicion.codigo)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {pestanaFicha === 'general' && (
                <>
              <div className="player-detail-overview">
                <div className="player-detail-identity">
                  <img
                    className="player-detail-avatar"
                    src={playerPlaceholder}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="player-detail-data">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <h2 className="h3 mb-0">{jugador.nombre}</h2>
                    <span
                      className={`badge ${
                        jugador.estado === 'En equipo'
                          ? 'text-bg-success'
                          : 'text-bg-secondary'
                      }`}
                    >
                      {jugador.estado}
                    </span>
                  </div>

                  <dl className="row mb-0">
                    <dt className="col-sm-4 text-body-secondary">Edad</dt>
                    <dd className="col-sm-8">{jugador.edad} años</dd>

                    <dt className="col-sm-4 text-body-secondary">Altura</dt>
                    <dd className="col-sm-8">{jugador.alturaCm} cm</dd>

                    {jugador.categoria && (
                      <>
                        <dt className="col-sm-4 text-body-secondary">Categoría</dt>
                        <dd className="col-sm-8">{jugador.categoria}</dd>
                      </>
                    )}

                    {jugador.equipoActual && (
                      <>
                        <dt className="col-sm-4 text-body-secondary">Equipo</dt>
                        <dd className="col-sm-8">{jugador.equipoActual}</dd>
                      </>
                    )}

                  </dl>

                  <div className="player-detail-graficos">
                    <JerseyNumberBadge dorsal={jugador.dorsalActual} size={42} />
                    <DominantFootIndicator piernaDominante={jugador.piernaDominante} />
                  </div>
                </div>
                </div>
                <div className="player-detail-radar">
                  <PlayerProfileRadar
                    jugadorId={jugador.id}
                    perfilScouting={perfilScouting}
                    versionActualizacion={versionValoraciones}
                  />
                </div>
                {perfilPosicionalCargado && (
                  <div className="player-detail-position-map">
                    <PositionFieldSelector
                      disabled
                      etiquetas="ninguna"
                      modo="resumen"
                      posiciones={posiciones}
                      posicionesAptasIds={posicionesAptasIds}
                      posicionesNaturalesIds={posicionesNaturalesIds}
                    />
                  </div>
                )}
              </div>

                <div className="player-detail-average-ratings">
                  <PlayerAverageRatings
                    jugadorId={jugador.id}
                    perfilScouting={perfilScouting}
                    versionActualizacion={versionValoraciones}
                  />
                </div>
                </>
              )}

              {pestanaFicha === 'historial' && (
                <section role="tabpanel">
                  <h2 className="h5 mb-2">Historial deportivo</h2>
                  <p className="text-body-secondary small mb-4">
                    Etapas del jugador por equipos y temporadas. Para añadir una nueva
                    etapa, hazlo desde «Editar jugador».
                  </p>
                  <TeamHistoryList
                    cargando={historialCargando}
                    error={errorHistorial}
                    historial={historialEquipos}
                    onEliminarHistorial={eliminarHistorialEquiposSeleccionados}
                  />
                </section>
              )}

              {pestanaFicha === 'estadisticas' && (
                <PlayerStatsTab observaciones={observaciones} perfilScouting={perfilScouting} />
              )}

              {pestanaFicha === 'exportar' && (
                <PlayerExportTab
                  jugador={jugador}
                  observaciones={observaciones}
                  perfilScouting={perfilScouting}
                  posiciones={posiciones}
                  posicionesAptasIds={posicionesAptasIds}
                  posicionesNaturalesIds={posicionesNaturalesIds}
                  valoracionesGenerales={valoracionesGenerales}
                />
              )}
            </div>
          </section>

          <div className="row g-4 mt-1">
            <div className="col-12 col-xl-5">
              <PlayerObservationForm
                equipoActualJugador={jugador.equipoActual}
                onCrearObservacion={añadirObservacion}
                onAlturaCambiar={setAlturaFormularioObservacion}
                perfilScouting={perfilScouting}
              />
            </div>

            <div className="col-12 col-xl-7">
              <PlayerObservationList
                alturaMaxima={alturaFormularioObservacion}
                cargando={observacionesCargando}
                equipoActualJugador={jugador.equipoActual}
                error={errorObservaciones}
                observaciones={observaciones}
                perfilScouting={perfilScouting}
                onActualizarObservacion={actualizarObservacionSeleccionada}
                onEliminarObservaciones={eliminarObservacionesSeleccionadas}
              />
            </div>
          </div>

          <section className="card mt-4 shadow-sm" aria-labelledby="valoracion-general-title">
            <div className="card-body p-4">
              <h2 id="valoracion-general-title" className="h4 mb-2">
                Informe general
              </h2>
              <p className="text-body-secondary small mb-4">
                Registra una impresión global del jugador en texto limpio, lista para
                compartir en exportaciones externas. Cada informe queda guardado como un
                registro histórico.
              </p>
              <GeneralRatingForm onCrearValoracion={añadirValoracionGeneral} />
              <GeneralRatingList
                cargando={valoracionesGeneralesCargando}
                error={errorValoracionesGenerales}
                onEliminarValoraciones={eliminarValoracionesGeneralesSeleccionadas}
                valoraciones={valoracionesGenerales}
              />
            </div>
          </section>
        </>
      )}
      <AppFooter />
    </main>
  )
}

export default PlayerDetailPage
