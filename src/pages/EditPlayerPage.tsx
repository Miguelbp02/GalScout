import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import PlayerForm from '../components/PlayerForm'
import TeamHistoryForm from '../components/TeamHistoryForm'
import { obtenerPerfilPosicionalJugador } from '../services/positionService'
import {
  actualizarJugador,
  eliminarJugador,
  obtenerJugadorPorId,
} from '../services/playerService'
import {
  actualizarHistorialEquipo,
  crearHistorialEquipo,
  desmarcarEquipoActualJugador,
  obtenerHistorialEquiposJugador,
} from '../services/teamHistoryService'
import { obtenerTemporadasRecientes } from '../constants/temporadas'
import type { Jugador, NuevoJugador } from '../types/jugador'
import type { HistorialEquipoJugador, NuevoHistorialEquipo } from '../types/historialEquipo'

type PestanaEdicion = 'datos' | 'historial'

const TEMPORADA_ACTUAL = obtenerTemporadasRecientes()[0]

function EditPlayerPage() {
  const { jugadorId } = useParams()
  const navigate = useNavigate()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [jugadorInicial, setJugadorInicial] = useState<NuevoJugador | null>(null)
  const [historial, setHistorial] = useState<HistorialEquipoJugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [pestanaEdicion, setPestanaEdicion] = useState<PestanaEdicion>('datos')

  const etapaActual = historial.find((etapa) => etapa.esActual) ?? null

  useEffect(() => {
    const id = jugadorId ?? ''
    if (!id) return

    async function cargarDatosEdicion() {
      setCargando(true)
      setError(null)

      try {
        const [jugadorObtenido, perfilPosicional, historialObtenido] = await Promise.all([
          obtenerJugadorPorId(id),
          obtenerPerfilPosicionalJugador(id),
          obtenerHistorialEquiposJugador(id),
        ])

        if (!jugadorObtenido) {
          setError('No se ha encontrado el jugador solicitado.')
          return
        }

        setJugador(jugadorObtenido)
        setHistorial(historialObtenido)
        setJugadorInicial({
          nombre: jugadorObtenido.nombre,
          edad: jugadorObtenido.edad,
          alturaCm: jugadorObtenido.alturaCm,
          piernaDominante: jugadorObtenido.piernaDominante,
          estado: jugadorObtenido.estado,
          categoria: jugadorObtenido.categoria ?? '',
          equipoActual: jugadorObtenido.equipoActual ?? '',
          esFicticio: jugadorObtenido.esFicticio,
          posicionesNaturalesIds: perfilPosicional.posicionesNaturalesIds,
          posicionesAptasIds: perfilPosicional.posicionesAptasIds,
        })
      } catch {
        setError('No se han podido cargar los datos del jugador.')
      } finally {
        setCargando(false)
      }
    }

    void cargarDatosEdicion()
  }, [jugadorId])

  async function guardarCambios(datosJugador: NuevoJugador) {
    if (!jugadorId) return

    await actualizarJugador(jugadorId, datosJugador)

    if (datosJugador.estado === 'Libre') {
      if (etapaActual) {
        await desmarcarEquipoActualJugador(jugadorId)
      }
    } else if (!etapaActual && datosJugador.equipoActual.trim()) {
      await crearHistorialEquipo(jugadorId, {
        nombreEquipo: datosJugador.equipoActual,
        temporada: TEMPORADA_ACTUAL,
        categoria: datosJugador.categoria,
        liga: '',
        grupoProvincia: '',
        dorsal: null,
        goles: null,
        partidos: null,
        notas: '',
        marcarComoActual: true,
      })
    }

    navigate(`/jugadores/${jugadorId}`)
  }

  async function añadirHistorialEquipo(historialNuevo: NuevoHistorialEquipo) {
    if (!jugadorId) return

    await crearHistorialEquipo(jugadorId, historialNuevo)
    setHistorial(await obtenerHistorialEquiposJugador(jugadorId))
  }

  async function actualizarEtapaHistorial(id: string, historialNuevo: NuevoHistorialEquipo) {
    if (!jugadorId) return

    await actualizarHistorialEquipo(id, jugadorId, historialNuevo)
    setHistorial(await obtenerHistorialEquiposJugador(jugadorId))
  }

  async function eliminarJugadorActual() {
    if (!jugadorId || !jugador) return

    const confirmado = window.confirm(
      `Vas a eliminar definitivamente a ${jugador.nombre} y todos sus informes, valoraciones y posiciones. Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setEliminando(true)
    setError(null)

    try {
      await eliminarJugador(jugadorId)
      navigate('/')
    } catch {
      setError('No se ha podido eliminar el jugador. Inténtalo de nuevo.')
      setEliminando(false)
    }
  }

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="d-flex align-items-center justify-content-between gap-3 mt-4">
        <div>
          <h2 className="h3 mb-1">Editar jugador</h2>
          {jugador && <p className="text-body-secondary mb-0">{jugador.nombre}</p>}
        </div>
        {jugadorId && (
          <Link className="btn btn-outline-secondary" to={`/jugadores/${jugadorId}`}>
            Volver a la ficha
          </Link>
        )}
      </div>

      {cargando && (
        <p className="py-5 text-center text-body-secondary">Cargando jugador…</p>
      )}

      {error && (
        <section className="alert alert-danger mt-4" role="alert">
          {error}
        </section>
      )}

      {jugadorInicial && !cargando && (
        <>
          <section
            className={`card player-detail-summary player-detail-summary--${pestanaEdicion} mt-4 shadow-sm`}
          >
            <div className="card-body p-3">
              <nav
                aria-label="Secciones de edición del jugador"
                className="player-detail-tabs"
                role="tablist"
              >
                {(
                  [
                    ['datos', 'Datos'],
                    ['historial', 'Historial'],
                  ] as const
                ).map(([pestana, etiqueta]) => (
                  <button
                    aria-selected={pestanaEdicion === pestana}
                    className={`player-detail-tab ${
                      pestanaEdicion === pestana ? 'active' : ''
                    }`}
                    key={pestana}
                    role="tab"
                    type="button"
                    onClick={() => setPestanaEdicion(pestana)}
                  >
                    {etiqueta}
                  </button>
                ))}
              </nav>

              {pestanaEdicion === 'datos' && (
                <PlayerForm
                  equipoActualBloqueado={Boolean(etapaActual)}
                  equipoActualEtiqueta={
                    etapaActual
                      ? `${etapaActual.equipoNombre}${
                          etapaActual.temporada ? ` · ${etapaActual.temporada}` : ''
                        }`
                      : null
                  }
                  jugadorInicial={jugadorInicial}
                  modo="editar"
                  sinTarjeta
                  onCancelar={() => navigate(`/jugadores/${jugadorId}`)}
                  onGuardarJugador={guardarCambios}
                />
              )}

              {pestanaEdicion === 'historial' && (
                <section role="tabpanel">
                  <h2 className="h5 mb-2">Añadir al historial deportivo</h2>
                  <p className="text-body-secondary small mb-4">
                    Registra una nueva etapa del jugador por equipo y temporada, con
                    categoría, liga, dorsal, goles y partidos cuando se conozcan. Si
                    eliges una temporada que ya tiene una etapa guardada, se rellenará
                    con esos datos y al guardar se actualizará en vez de crear otra.
                    Podrás consultar el historial completo desde la ficha del
                    jugador.
                  </p>
                  <TeamHistoryForm
                    historial={historial}
                    onActualizarHistorial={actualizarEtapaHistorial}
                    onCrearHistorial={añadirHistorialEquipo}
                  />
                </section>
              )}
            </div>
          </section>

          <section className="card border-danger-subtle mt-4">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h3 className="h6 mb-1">Zona de peligro</h3>
                <p className="text-body-secondary small mb-0">
                  Elimina al jugador y todos sus datos de scouting asociados.
                </p>
              </div>
              <button
                className="btn btn-outline-danger"
                disabled={eliminando}
                type="button"
                onClick={eliminarJugadorActual}
              >
                {eliminando ? 'Eliminando…' : 'Eliminar jugador'}
              </button>
            </div>
          </section>
        </>
      )}
      <AppFooter />
    </main>
  )
}

export default EditPlayerPage
