import { useEffect, useState, type FormEvent } from 'react'
import PositionFieldSelector from './PositionFieldSelector'
import { obtenerPosiciones } from '../services/positionService'
import type {
  EstadoJugador,
  NuevoJugador,
  PiernaDominante,
} from '../types/jugador'
import type { Posicion } from '../types/posicion'

interface PlayerFormProps {
  modo?: 'crear' | 'editar'
  jugadorInicial?: NuevoJugador
  onCancelar?: () => void
  onGuardarJugador: (jugador: NuevoJugador) => Promise<void>
}

const datosJugadorIniciales: NuevoJugador = {
  nombre: '',
  edad: 16,
  alturaCm: 170,
  posicionesNaturalesIds: [],
  posicionesAptasIds: [],
  piernaDominante: 'Derecha',
  estado: 'En equipo',
}

function contienePosicion(posiciones: number[], posicionId: number) {
  return posiciones.includes(posicionId)
}

function PlayerForm({
  modo = 'crear',
  jugadorInicial = datosJugadorIniciales,
  onCancelar,
  onGuardarJugador,
}: PlayerFormProps) {
  const [jugador, setJugador] = useState<NuevoJugador>(jugadorInicial)
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [cargandoPosiciones, setCargandoPosiciones] = useState(true)
  const [errorPosiciones, setErrorPosiciones] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarPosiciones() {
      try {
        setPosiciones(await obtenerPosiciones())
      } catch {
        setErrorPosiciones('No se ha podido cargar el catálogo de posiciones.')
      } finally {
        setCargandoPosiciones(false)
      }
    }

    void cargarPosiciones()
  }, [])

  function cambiarEstadoPosicion(
    posicionId: number,
    tipo: 'natural' | 'apta' | null,
  ) {
    setJugador((jugadorActual) => {
      if (tipo === 'natural') {
        return {
          ...jugadorActual,
          posicionesNaturalesIds: contienePosicion(
            jugadorActual.posicionesNaturalesIds,
            posicionId,
          )
            ? jugadorActual.posicionesNaturalesIds
            : [...jugadorActual.posicionesNaturalesIds, posicionId],
          posicionesAptasIds: jugadorActual.posicionesAptasIds.filter(
            (id) => id !== posicionId,
          ),
        }
      }

      if (tipo === 'apta') {
        return {
          ...jugadorActual,
          posicionesAptasIds: contienePosicion(
            jugadorActual.posicionesAptasIds,
            posicionId,
          )
            ? jugadorActual.posicionesAptasIds
            : [...jugadorActual.posicionesAptasIds, posicionId],
          posicionesNaturalesIds: jugadorActual.posicionesNaturalesIds.filter(
            (id) => id !== posicionId,
          ),
        }
      }

      return {
        ...jugadorActual,
        posicionesNaturalesIds: jugadorActual.posicionesNaturalesIds.filter(
          (id) => id !== posicionId,
        ),
        posicionesAptasIds: jugadorActual.posicionesAptasIds.filter(
          (id) => id !== posicionId,
        ),
      }
    })
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (jugador.posicionesNaturalesIds.length === 0) {
      setError('Selecciona al menos una posición natural en el campo.')
      return
    }

    setError(null)
    setGuardando(true)

    try {
      await onGuardarJugador(jugador)

      if (modo === 'crear') {
        setJugador(datosJugadorIniciales)
      }
    } catch {
      setError(
        modo === 'crear'
          ? 'No se ha podido guardar el jugador. Inténtalo de nuevo.'
          : 'No se han podido guardar los cambios. Inténtalo de nuevo.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const formularioBloqueado = guardando || cargandoPosiciones || Boolean(errorPosiciones)
  const titulo = modo === 'crear' ? 'Añadir jugador' : 'Editar jugador'
  const textoBoton = guardando
    ? 'Guardando…'
    : modo === 'crear'
      ? 'Guardar jugador'
      : 'Guardar cambios'

  return (
    <section className="card shadow-sm mt-5" aria-labelledby="player-form-title">
      <div className="card-body p-4">
        <h2 id="player-form-title" className="h4 mb-4">
          {titulo}
        </h2>

        <form onSubmit={enviarFormulario}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="nombre">
                Nombre
              </label>
              <input
                className="form-control"
                disabled={formularioBloqueado}
                id="nombre"
                required
                type="text"
                value={jugador.nombre}
                onChange={(evento) =>
                  setJugador({ ...jugador, nombre: evento.target.value })
                }
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label" htmlFor="edad">
                Edad
              </label>
              <input
                className="form-control"
                disabled={formularioBloqueado}
                id="edad"
                min="1"
                required
                type="number"
                value={jugador.edad}
                onChange={(evento) =>
                  setJugador({ ...jugador, edad: Number(evento.target.value) })
                }
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label" htmlFor="altura">
                Altura (cm)
              </label>
              <input
                className="form-control"
                disabled={formularioBloqueado}
                id="altura"
                min="1"
                required
                type="number"
                value={jugador.alturaCm}
                onChange={(evento) =>
                  setJugador({
                    ...jugador,
                    alturaCm: Number(evento.target.value),
                  })
                }
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="pierna-dominante">
                Pierna dominante
              </label>
              <select
                className="form-select"
                disabled={formularioBloqueado}
                id="pierna-dominante"
                value={jugador.piernaDominante}
                onChange={(evento) =>
                  setJugador({
                    ...jugador,
                    piernaDominante: evento.target.value as PiernaDominante,
                  })
                }
              >
                <option value="Derecha">Derecha</option>
                <option value="Izquierda">Izquierda</option>
                <option value="Ambas">Ambas</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="estado">
                Estado
              </label>
              <select
                className="form-select"
                disabled={formularioBloqueado}
                id="estado"
                value={jugador.estado}
                onChange={(evento) =>
                  setJugador({
                    ...jugador,
                    estado: evento.target.value as EstadoJugador,
                  })
                }
              >
                <option value="En equipo">En equipo</option>
                <option value="Libre">Libre</option>
              </select>
            </div>

            <div className="col-12">
              {cargandoPosiciones && (
                <p className="small text-body-secondary mb-0">Cargando posiciones…</p>
              )}

              {errorPosiciones && (
                <p className="alert alert-danger py-2 mb-0" role="alert">
                  {errorPosiciones}
                </p>
              )}

              {!cargandoPosiciones && !errorPosiciones && (
                <PositionFieldSelector
                  disabled={formularioBloqueado}
                  etiquetas="recorte"
                  inclinado
                  posiciones={posiciones}
                  posicionesAptasIds={jugador.posicionesAptasIds}
                  posicionesNaturalesIds={jugador.posicionesNaturalesIds}
                  onCambiarEstadoPosicion={cambiarEstadoPosicion}
                />
              )}
            </div>
          </div>

          {error && (
            <p className="alert alert-danger mt-4 mb-0" role="alert">
              {error}
            </p>
          )}

          <div className="d-flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary" disabled={formularioBloqueado} type="submit">
              {textoBoton}
            </button>
            {onCancelar && (
              <button
                className="btn btn-outline-secondary"
                disabled={guardando}
                type="button"
                onClick={onCancelar}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default PlayerForm
