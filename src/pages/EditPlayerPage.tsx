import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import PlayerForm from '../components/PlayerForm'
import { obtenerPerfilPosicionalJugador } from '../services/positionService'
import { actualizarJugador, obtenerJugadorPorId } from '../services/playerService'
import type { Jugador, NuevoJugador } from '../types/jugador'

function EditPlayerPage() {
  const { jugadorId } = useParams()
  const navigate = useNavigate()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [jugadorInicial, setJugadorInicial] = useState<NuevoJugador | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {jugadorInicial && !cargando && !error && (
        <PlayerForm
          jugadorInicial={jugadorInicial}
          modo="editar"
          onCancelar={() => navigate(`/jugadores/${jugadorId}`)}
          onGuardarJugador={guardarCambios}
        />
      )}
    </main>
  )
}

export default EditPlayerPage
