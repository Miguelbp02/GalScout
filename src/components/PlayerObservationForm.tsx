import { useEffect, useRef, useState, type FormEvent } from 'react'
import { obtenerCriteriosScouting } from '../services/criteriaService'
import type {
  CriterioScouting,
  GrupoCriterio,
  PerfilScouting,
} from '../types/criterio'
import type { NuevaObservacion } from '../types/observacion'

interface PlayerObservationFormProps {
  onCrearObservacion: (observacion: NuevaObservacion) => Promise<void>
  onAlturaCambiar?: (altura: number) => void
  perfilScouting: PerfilScouting
}

const grupos: GrupoCriterio[] = ['Físico', 'Técnico', 'Táctico', 'Mental']

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function PlayerObservationForm({
  onCrearObservacion,
  onAlturaCambiar,
  perfilScouting,
}: PlayerObservationFormProps) {
  const tarjetaRef = useRef<HTMLElement>(null)
  const [fechaObservacion, setFechaObservacion] = useState(obtenerFechaActual)
  const [notas, setNotas] = useState('')
  const [criterios, setCriterios] = useState<CriterioScouting[]>([])
  const [puntuaciones, setPuntuaciones] = useState<Record<number, string>>({})
  const [cargandoCriterios, setCargandoCriterios] = useState(true)
  const [errorCriterios, setErrorCriterios] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarCriterios() {
      setCargandoCriterios(true)
      setErrorCriterios(null)
      setPuntuaciones({})

      try {
        setCriterios(await obtenerCriteriosScouting(perfilScouting))
      } catch {
        setErrorCriterios('No se han podido cargar los criterios de valoración.')
      } finally {
        setCargandoCriterios(false)
      }
    }

    void cargarCriterios()
  }, [perfilScouting])

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
        fechaObservacion,
        notas: notasLimpias,
        valoraciones,
      })
      setFechaObservacion(obtenerFechaActual())
      setNotas('')
      setPuntuaciones({})
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
          <div className="mb-3">
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

          <details className="observation-ratings mb-4">
            <summary className="fw-semibold">
              Valoraciones opcionales (de 0 a 20)
            </summary>
            <p className="small text-body-secondary mt-2 mb-3">
              Rellena únicamente los atributos que hayas podido valorar con criterio
              en este informe.
            </p>

            {cargandoCriterios && (
              <p className="small text-body-secondary">Cargando criterios…</p>
            )}

            {errorCriterios && (
              <p className="alert alert-warning py-2 small" role="alert">
                {errorCriterios}
              </p>
            )}

            {!cargandoCriterios && !errorCriterios && (
              <div className="d-grid gap-2">
                {grupos.map((grupo) => {
                  const criteriosDelGrupo = criterios.filter(
                    (criterio) => criterio.grupo === grupo,
                  )

                  return (
                    <details className="criteria-group" key={grupo}>
                      <summary className="fw-semibold">
                          {grupo} ({criteriosDelGrupo.length})
                      </summary>
                      <div className="pt-3">
                        <div className="row g-3">
                          {criteriosDelGrupo.map((criterio) => {
                            const idInput = `criterio-${criterio.id}`

                            return (
                              <div className="col-12 col-sm-6" key={criterio.id}>
                                <label className="form-label small" htmlFor={idInput}>
                                  {criterio.nombre}
                                </label>
                                <input
                                  className="form-control"
                                  disabled={guardando}
                                  id={idInput}
                                  inputMode="numeric"
                                  max={20}
                                  min={0}
                                  placeholder="Sin valorar"
                                  step={1}
                                  type="number"
                                  value={puntuaciones[criterio.id] ?? ''}
                                  onChange={(evento) =>
                                    actualizarPuntuacion(criterio.id, evento.target.value)
                                  }
                                />
                              </div>
                            )
                          })}
                          </div>
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </details>

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
