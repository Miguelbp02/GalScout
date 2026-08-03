import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { obtenerCriteriosScouting } from '../services/criteriaService'
import { obtenerEquipos } from '../services/teamService'
import CriteriaRatingsInput from './CriteriaRatingsInput'
import type {
  CriterioScouting,
  PerfilScouting,
} from '../types/criterio'
import type { NuevaObservacion, TipoObservacion } from '../types/observacion'
import { useToast } from './ToastContext'

interface PlayerObservationFormProps {
  onCrearObservacion: (observacion: NuevaObservacion) => Promise<void>
  onAlturaCambiar?: (altura: number) => void
  perfilScouting: PerfilScouting
  equipoActualJugador: string | null
}

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function PlayerObservationForm({
  onCrearObservacion,
  onAlturaCambiar,
  perfilScouting,
  equipoActualJugador,
}: PlayerObservationFormProps) {
  const idListaEquipos = useId()
  const tarjetaRef = useRef<HTMLElement>(null)
  const [tipo, setTipo] = useState<TipoObservacion>('entrenamiento')
  const [fechaObservacion, setFechaObservacion] = useState(obtenerFechaActual)
  const [nombresEquipos, setNombresEquipos] = useState<string[]>([])
  const [equipoJugador, setEquipoJugador] = useState(equipoActualJugador ?? '')
  const [equipoRival, setEquipoRival] = useState('')
  const [competicion, setCompeticion] = useState('')
  const [jornada, setJornada] = useState('')
  const [notas, setNotas] = useState('')
  const [criterios, setCriterios] = useState<CriterioScouting[]>([])
  const [puntuaciones, setPuntuaciones] = useState<Record<number, string>>({})
  const [cargandoCriterios, setCargandoCriterios] = useState(true)
  const [errorCriterios, setErrorCriterios] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  useEffect(() => {
    let cancelado = false

    async function cargarCriterios() {
      setCargandoCriterios(true)
      setErrorCriterios(null)
      setPuntuaciones({})

      try {
        const criteriosObtenidos = await obtenerCriteriosScouting(perfilScouting)
        if (cancelado) return
        setCriterios(criteriosObtenidos)
      } catch {
        if (cancelado) return
        setErrorCriterios('No se han podido cargar los criterios de valoración.')
      } finally {
        if (!cancelado) setCargandoCriterios(false)
      }
    }

    void cargarCriterios()

    return () => {
      cancelado = true
    }
  }, [perfilScouting])

  useEffect(() => {
    obtenerEquipos()
      .then((equipos) => setNombresEquipos(equipos.map((equipo) => equipo.nombre)))
      .catch(() => setNombresEquipos([]))
  }, [])

  useEffect(() => {
    const tarjeta = tarjetaRef.current
    if (!tarjeta || !onAlturaCambiar) return

    const notificarAltura = () => {
      onAlturaCambiar(Math.ceil(tarjeta.getBoundingClientRect().height))
    }

    const observador = new ResizeObserver(notificarAltura)
    observador.observe(tarjeta)
    notificarAltura()

    return () => observador.disconnect()
  }, [onAlturaCambiar])

  function actualizarPuntuacion(criterioId: number, valor: string) {
    setPuntuaciones((puntuacionesActuales) => ({
      ...puntuacionesActuales,
      [criterioId]: valor,
    }))
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const notasLimpias = notas.trim()

    if (!notasLimpias) {
      setError('Escribe una observación antes de guardar.')
      return
    }

    const valoraciones = criterios.flatMap((criterio) => {
      const textoPuntuacion = puntuaciones[criterio.id]?.trim() ?? ''

      if (!textoPuntuacion) return []

      return [
        {
          criterioId: criterio.id,
          puntuacion: Number(textoPuntuacion),
        },
      ]
    })

    setError(null)
    setGuardando(true)

    try {
      await onCrearObservacion({
        tipo,
        fechaObservacion,
        notas: notasLimpias,
        equipoJugador: tipo === 'partido' ? equipoJugador : '',
        equipoRival: tipo === 'partido' ? equipoRival : '',
        competicion: tipo === 'partido' ? competicion : '',
        jornada: tipo === 'partido' ? jornada : '',
        valoraciones,
      })
      setFechaObservacion(obtenerFechaActual())
      setNotas('')
      setPuntuaciones({})
      mostrarToast('Observación guardada')
    } catch {
      setError('No se ha podido guardar la observación. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section
      ref={tarjetaRef}
      className="card shadow-sm"
      aria-labelledby="new-observation-title"
    >
      <div className="card-body p-4">
        <h2 id="new-observation-title" className="h4 mb-4">
          Añadir observación
        </h2>

        <form onSubmit={enviarFormulario}>
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="tipo-observacion">
                Tipo
              </label>
              <select
                className="form-select"
                disabled={guardando}
                id="tipo-observacion"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value as TipoObservacion)}
              >
                <option value="entrenamiento">Entrenamiento</option>
                <option value="partido">Partido</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="fecha-observacion">
                Fecha de observación
              </label>
              <input
                className="form-control"
                disabled={guardando}
                id="fecha-observacion"
                required
                type="date"
                value={fechaObservacion}
                onChange={(evento) => setFechaObservacion(evento.target.value)}
              />
            </div>
          </div>

          {tipo === 'partido' && (
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="equipo-jugador-observacion">
                  Equipo del jugador
                </label>
                <input
                  className="form-control"
                  disabled={guardando}
                  id="equipo-jugador-observacion"
                  list={idListaEquipos}
                  placeholder="Equipo del jugador en ese partido"
                  type="text"
                  value={equipoJugador}
                  onChange={(evento) => setEquipoJugador(evento.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="equipo-rival-observacion">
                  Rival
                </label>
                <input
                  className="form-control"
                  disabled={guardando}
                  id="equipo-rival-observacion"
                  list={idListaEquipos}
                  placeholder="Nombre del equipo rival"
                  type="text"
                  value={equipoRival}
                  onChange={(evento) => setEquipoRival(evento.target.value)}
                />
              </div>

              <datalist id={idListaEquipos}>
                {nombresEquipos.map((nombre) => (
                  <option key={nombre} value={nombre} />
                ))}
              </datalist>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="competicion-observacion">
                  Competición <span className="text-body-secondary">(opcional)</span>
                </label>
                <input
                  className="form-control"
                  disabled={guardando}
                  id="competicion-observacion"
                  placeholder="Ej. Liga, Copa, amistoso..."
                  type="text"
                  value={competicion}
                  onChange={(evento) => setCompeticion(evento.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="jornada-observacion">
                  Jornada <span className="text-body-secondary">(opcional)</span>
                </label>
                <input
                  className="form-control"
                  disabled={guardando}
                  id="jornada-observacion"
                  placeholder="Ej. Jornada 12"
                  type="text"
                  value={jornada}
                  onChange={(evento) => setJornada(evento.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="form-label" htmlFor="notas-observacion">
              Notas
            </label>
            <textarea
              className="form-control"
              disabled={guardando}
              id="notas-observacion"
              placeholder="Describe lo observado en el partido o entrenamiento."
              required
              rows={7}
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
            />
          </div>

          <CriteriaRatingsInput
            cargando={cargandoCriterios}
            criterios={criterios}
            disabled={guardando}
            error={errorCriterios}
            puntuaciones={puntuaciones}
            onCambiarPuntuacion={actualizarPuntuacion}
          />

          {error && (
            <p className="alert alert-danger py-2" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary" disabled={guardando} type="submit">
            {guardando ? 'Guardando…' : 'Guardar observación'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default PlayerObservationForm
