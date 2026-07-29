import { useEffect, useState, type FormEvent } from 'react'
import PositionFieldSelector from './PositionFieldSelector'
import { obtenerPosiciones } from '../services/positionService'
import type {
  EstadoJugador,
  CategoriaJugador,
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
  categoria: '',
}

function contienePosicion(posiciones: number[], posicionId: number) {
  return posiciones.includes(posicionId)
}

function categoriaEsValidaParaEdad(
  categoria: CategoriaJugador | '',
  edad: number,
) {
  if (!categoria) return true
  if (categoria === 'Senior') return true
  if (categoria === 'Juvenil') return edad <= 18

  return edad <= 15
}

function obtenerCategoriasDisponibles(edad: number): CategoriaJugador[] {
  if (edad >= 19) return ['Senior']
  if (edad >= 16) return ['Juvenil', 'Senior']

  return ['Cadete', 'Juvenil', 'Senior']
}

function PlayerForm({
  modo = 'crear',
  jugadorInicial = datosJugadorIniciales,
  onCancelar,
  onGuardarJugador,
}: PlayerFormProps) {
  const [jugador, setJugador] = useState<NuevoJugador>(jugadorInicial)
  const [edadTexto, setEdadTexto] = useState(String(jugadorInicial.edad))
  const [alturaTexto, setAlturaTexto] = useState(String(jugadorInicial.alturaCm))
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

    const edad = Number(edadTexto)
    const alturaCm = Number(alturaTexto)

    if (!Number.isInteger(edad) || edad < 1 || !Number.isInteger(alturaCm) || alturaCm < 1) {
      setError('Indica una edad y una altura vÃ¡lidas.')
      return
    }

    if (!categoriaEsValidaParaEdad(jugador.categoria, edad)) {
      setError('La categoría seleccionada no corresponde con la edad del jugador.')
      return
    }

    if (jugador.posicionesNaturalesIds.length === 0) {
      setError('Selecciona al menos una posición natural en el campo.')
      return
    }

    setError(null)
    setGuardando(true)

    try {
      await onGuardarJugador({ ...jugador, edad, alturaCm })

      if (modo === 'crear') {
        setJugador(datosJugadorIniciales)
        setEdadTexto(String(datosJugadorIniciales.edad))
        setAlturaTexto(String(datosJugadorIniciales.alturaCm))
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
  const edadFormulario = Number(edadTexto)
  const categoriasDisponibles = obtenerCategoriasDisponibles(edadFormulario)

  return (
    <section className="card shadow-sm mt-5" aria-labelledby="player-form-title">
      <div className="card-body p-4">
        <h2 id="player-form-title" className="h4 mb-4">
          {titulo}
        </h2>

        <form onSubmit={enviarFormulario}>
          <div className="row g-4 align-items-start">
            <div className="col-12 col-lg-5">
              <div className="row g-3">
            <div className="col-12">
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

            <div className="col-6 col-md-4">
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
                value={edadTexto}
                onChange={(evento) => {
                  const nuevaEdadTexto = evento.target.value
                  const nuevaEdad = Number(nuevaEdadTexto)

                  setEdadTexto(nuevaEdadTexto)
                  setJugador((jugadorActual) => ({
                    ...jugadorActual,
                    categoria: categoriaEsValidaParaEdad(
                      jugadorActual.categoria,
                      nuevaEdad,
                    )
                      ? jugadorActual.categoria
                      : '',
                  }))
                }}
              />
            </div>

            <div className="col-6 col-md-4">
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
                value={alturaTexto}
                onChange={(evento) => setAlturaTexto(evento.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
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
              <label className="form-label" htmlFor="categoria">
                Categoría <span className="text-body-secondary">(opcional)</span>
              </label>
              <select
                className="form-select"
                disabled={formularioBloqueado}
                id="categoria"
                value={jugador.categoria}
                onChange={(evento) =>
                  setJugador({
                    ...jugador,
                    categoria: evento.target.value as CategoriaJugador | '',
                  })
                }
              >
                <option value="">Sin indicar</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
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
            </div>

            <div className="col-12 col-lg-7">
              <div className="player-form-position">
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
          </div>
        </form>
      </div>
    </section>
  )
}

export default PlayerForm
