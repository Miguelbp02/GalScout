import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logoAppOjeo from '../assets/logoAppOjeo.png'
import playerPlaceholder from '../assets/player-placeholder.png'
import PlayerAverageRatings from '../components/PlayerAverageRatings'
import GeneralRatingForm from '../components/GeneralRatingForm'
import GeneralRatingList from '../components/GeneralRatingList'
import PlayerObservationForm from '../components/PlayerObservationForm'
import PlayerObservationList from '../components/PlayerObservationList'
import PositionFieldSelector from '../components/PositionFieldSelector'
import DominantFootIndicator from '../components/DominantFootIndicator'
import {
  crearObservacionJugador,
  obtenerObservacionesJugador,
} from '../services/observationService'
import { obtenerJugadorPorId } from '../services/playerService'
import {
  obtenerPerfilPosicionalJugador,
  obtenerPosiciones,
} from '../services/positionService'
import {
  crearValoracionGeneral,
  obtenerValoracionesGeneralesJugador,
} from '../services/generalRatingService'
import type { Jugador } from '../types/jugador'
import type { Posicion } from '../types/posicion'
import type {
  NuevaObservacion,
  ObservacionJugador,
} from '../types/observacion'
import type {
  NuevaValoracionGeneral,
  ValoracionGeneral,
} from '../types/valoracionGeneral'

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
          'No se han podido cargar las valoraciones generales.',
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

  const errorVisible = jugadorId
    ? error
    : 'No se ha recibido un identificador de jugador válido.'

  return (
    <main className="app-shell">
      <header className="app-header d-flex align-items-center justify-content-between gap-3">
        <div className="app-brand">
          <div className="app-logo-crop app-logo-crop-header">
            <img src={logoAppOjeo} alt="Logo de Ojeo Galicia" />
          </div>
          <div>
            <p className="app-kicker">Ojeo</p>
            <h1>{jugador?.nombre ?? 'Ficha de jugador'}</h1>
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-end gap-2">
          <Link className="btn btn-primary" to={`/jugadores/${jugadorId}/editar`}>
            Editar jugador
          </Link>
          <Link className="btn btn-outline-secondary" to="/">
            Volver a jugadores
          </Link>
        </div>
      </header>

      {cargando && jugadorId && (
        <p className="py-5 text-center text-body-secondary">Cargando ficha…</p>
      )}

      {errorVisible && (
        <section className="alert alert-danger mt-5" role="alert">
          {errorVisible}
        </section>
      )}

      {jugador && !cargando && !errorVisible && (
        <>
          <section className="card mt-5 shadow-sm">
            <div className="card-body p-4">
              <div className="row align-items-center g-4">
                <div className="col-12 col-md-auto text-center">
                  <img
                    className="player-detail-avatar"
                    src={playerPlaceholder}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="col">
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

                    <dt className="col-sm-4 text-body-secondary">Pierna dominante</dt>
                    <dd className="col-sm-8 mb-0 player-dominant-foot-value">
                      <DominantFootIndicator piernaDominante={jugador.piernaDominante} />
                    </dd>
                  </dl>
                </div>
                {perfilPosicionalCargado && (
                  <div className="col-12 col-md-auto text-center me-md-4">
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
            </div>
          </section>

          <div className="mt-4">
            <PlayerAverageRatings
              jugadorId={jugador.id}
              versionActualizacion={versionValoraciones}
            />
          </div>

          <div className="row g-4 mt-1">
            <div className="col-12 col-xl-5">
              <PlayerObservationForm onCrearObservacion={añadirObservacion} />
            </div>

            <div className="col-12 col-xl-7">
              <PlayerObservationList
                cargando={observacionesCargando}
                error={errorObservaciones}
                observaciones={observaciones}
              />
            </div>
          </div>

          <section className="card mt-4 shadow-sm" aria-labelledby="valoracion-general-title">
            <div className="card-body p-4">
              <h2 id="valoracion-general-title" className="h4 mb-2">
                Valoración general
              </h2>
              <p className="text-body-secondary small mb-4">
                Registra una impresión global del jugador. Cada valoración queda guardada
                como un registro histórico.
              </p>
              <GeneralRatingForm onCrearValoracion={añadirValoracionGeneral} />
              <GeneralRatingList
                cargando={valoracionesGeneralesCargando}
                error={errorValoracionesGenerales}
                valoraciones={valoracionesGenerales}
              />
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default PlayerDetailPage
