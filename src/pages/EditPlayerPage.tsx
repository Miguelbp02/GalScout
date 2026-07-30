import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import PlayerForm from '../components/PlayerForm'
import { obtenerPerfilPosicionalJugador } from '../services/positionService'
import {
  actualizarJugador,
  eliminarJugador,
  obtenerJugadorPorId,
} from '../services/playerService'
import type { Jugador, NuevoJugador } from '../types/jugador'

function EditPlayerPage() {
  const { jugadorId } = useParams()
  const navigate = useNavigate()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [jugadorInicial, setJugadorInicial] = useState<NuevoJugador | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const id = jugadorId ?? ''
    if (!id) return

    async function cargarDatosEdicion() {
      setCargando(true)
      setError(null)

      try {
        const [jugadorObtenido, perfilPosicional] = await Promise.all([
          obtenerJugadorPorId(id),
          obtenerPerfilPosicionalJugador(id),
        ])

        if (!jugadorObtenido) {
          setError('No se ha encontrado el jugador solicitado.')
          return
        }

        setJugador(jugadorObtenido)
        setJugadorInicial({
          nombre: jugadorObtenido.nombre,
          edad: jugadorObtenido.edad,
          alturaCm: jugadorObtenido.alturaCm,
          piernaDominante: jugadorObtenido.piernaDominante,
          estado: jugadorObtenido.estado,
          categoria: jugadorObtenido.categoria ?? '',
          equipoActual: jugadorObtenido.equipoActual ?? '',
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
    navigate(`/jugadores/${jugadorId}`)
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
          <PlayerForm
            jugadorInicial={jugadorInicial}
            modo="editar"
            onCancelar={() => navigate(`/jugadores/${jugadorId}`)}
            onGuardarJugador={guardarCambios}
          />

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
