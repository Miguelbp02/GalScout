import { useEffect, useMemo, useState } from 'react'
import { obtenerJugadores } from '../services/playerService'
import { obtenerPosiciones } from '../services/positionService'
import type { PerfilScouting } from '../types/criterio'
import type { Jugador } from '../types/jugador'
import { COLORES_JUGADOR, type EquipoSesion } from '../types/matchSession'
import type { Posicion } from '../types/posicion'
import { useMatchSession } from './MatchSessionContext'
import PlayerSelect from './PlayerSelect'

interface MatchAddPlayerFormProps {
  onCerrar: () => void
  onJugadorSeleccionado: (nombre: string) => void
}

function normalizarNombreEquipo(nombre: string) {
  return nombre.trim().toLocaleLowerCase('es-ES')
}

function MatchAddPlayerForm({
  onCerrar,
  onJugadorSeleccionado,
}: MatchAddPlayerFormProps) {
  const { sesion, agregarJugador } = useMatchSession()
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [jugadorId, setJugadorId] = useState('')
  const [equipo, setEquipo] = useState<EquipoSesion | ''>('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([obtenerJugadores(), obtenerPosiciones()])
      .then(([jugadoresObtenidos, posicionesObtenidas]) => {
        setJugadores(jugadoresObtenidos)
        setPosiciones(posicionesObtenidas)
      })
      .catch(() => setError('No se han podido cargar los jugadores.'))
      .finally(() => setCargando(false))
  }, [])

  const posicionPorteroId = useMemo(
    () => posiciones.find((posicion) => posicion.codigo === 'portero')?.id,
    [posiciones],
  )

  if (!sesion) return null

  const sesionActiva = sesion
  const idsEnSeguimiento = new Set(sesionActiva.jugadores.map((jugador) => jugador.id))
  const jugadoresDisponibles = jugadores
    .filter((jugador) => !idsEnSeguimiento.has(jugador.id))
    .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'))
  const jugadorSeleccionado = jugadores.find((jugador) => jugador.id === jugadorId)

  function seleccionarJugador(nuevoJugadorId: string) {
    setJugadorId(nuevoJugadorId)
    setError(null)

    const jugador = jugadores.find((item) => item.id === nuevoJugadorId)
    onJugadorSeleccionado(jugador?.nombre ?? '')
    const equipoRegistrado = normalizarNombreEquipo(jugador?.equipoActual ?? '')

    if (equipoRegistrado === normalizarNombreEquipo(sesionActiva.nombreEquipoA)) {
      setEquipo('A')
    } else if (equipoRegistrado === normalizarNombreEquipo(sesionActiva.nombreEquipoB)) {
      setEquipo('B')
    } else {
      setEquipo('')
    }
  }

  function confirmarJugador() {
    if (!jugadorSeleccionado) {
      setError('Selecciona un jugador para añadirlo al seguimiento.')
      return
    }

    if (idsEnSeguimiento.has(jugadorSeleccionado.id)) {
      setError('Este jugador ya se ha añadido al seguimiento.')
      return
    }

    if (!equipo) {
      setError('Indica por qué equipo juega en este partido.')
      return
    }

    const perfilScouting: PerfilScouting =
      posicionPorteroId !== undefined &&
      jugadorSeleccionado.posicionesNaturalesIds.includes(posicionPorteroId)
        ? 'portero'
        : 'campo'
    const coloresUsados = new Set(sesionActiva.jugadores.map((jugador) => jugador.color))
    const color =
      COLORES_JUGADOR.find((colorDisponible) => !coloresUsados.has(colorDisponible)) ??
      COLORES_JUGADOR[sesionActiva.jugadores.length % COLORES_JUGADOR.length]

    agregarJugador({
      id: jugadorSeleccionado.id,
      nombre: jugadorSeleccionado.nombre,
      perfilScouting,
      equipo,
      color,
    })
    onCerrar()
  }

  return (
    <div className="match-add-player-form">
      <div>
        <h3 className="h6 mb-1">Añadir jugador al seguimiento</h3>
        <p className="small text-body-secondary mb-0">
          Puedes seguir hasta cuatro jugadores durante el partido.
        </p>
      </div>

      {cargando ? (
        <p className="text-body-secondary mb-0">Cargando jugadores…</p>
      ) : (
        <>
          <div>
            <label className="form-label" htmlFor="añadir-jugador-partido">
              Jugador
            </label>
            <PlayerSelect
              id="añadir-jugador-partido"
              jugadores={jugadoresDisponibles}
              posiciones={posiciones}
              textoVacio="Selecciona un jugador"
              valor={jugadorId}
              onCambiar={seleccionarJugador}
            />
          </div>

          {jugadorSeleccionado && (
            <div>
              <p className="form-label mb-2">Equipo en este partido</p>
              {jugadorSeleccionado.equipoActual && (
                <p className="small text-body-secondary mb-2">
                  Equipo registrado: {jugadorSeleccionado.equipoActual}
                </p>
              )}
              <div className="match-add-player-teams">
                <button
                  className={`btn btn-sm ${equipo === 'A' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  type="button"
                  onClick={() => setEquipo('A')}
                >
                  {sesionActiva.nombreEquipoA}
                </button>
                <button
                  className={`btn btn-sm ${equipo === 'B' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  type="button"
                  onClick={() => setEquipo('B')}
                >
                  {sesionActiva.nombreEquipoB}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="alert alert-danger py-2 mb-0" role="alert">
              {error}
            </p>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-outline-secondary" type="button" onClick={onCerrar}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="button" onClick={confirmarJugador}>
              Añadir al seguimiento
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default MatchAddPlayerForm
