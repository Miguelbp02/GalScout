import { useRef, useState } from 'react'
import FormattedNotes from './FormattedNotes'
import HistoryListSkeleton from './HistoryListSkeleton'
import ObservationEditForm from './ObservationEditForm'
import PencilIcon from './PencilIcon'
import TrashIcon from './TrashIcon'
import { obtenerAccionesObservacion } from '../services/observationService'
import type { AccionObservacion } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'
import type { NuevaObservacion, ObservacionJugador } from '../types/observacion'

interface PlayerObservationListProps {
  alturaMaxima?: number
  cargando: boolean
  error: string | null
  perfilScouting: PerfilScouting
  equipoActualJugador: string | null
  onEliminarObservaciones: (ids: string[]) => Promise<void>
  onActualizarObservacion: (id: string, observacion: NuevaObservacion) => Promise<void>
  observaciones: ObservacionJugador[]
}

function formatearFecha(fecha: string, incluirHora = false) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    ...(incluirHora ? { timeStyle: 'short' } : {}),
  }).format(new Date(fecha))
}

const etiquetaTipo: Record<string, string> = {
  partido: 'Partido',
  entrenamiento: 'Entrenamiento',
  otro: 'Otro',
}

function PlayerObservationList({
  alturaMaxima,
  cargando,
  error,
  perfilScouting,
  equipoActualJugador,
  onEliminarObservaciones,
  onActualizarObservacion,
  observaciones,
}: PlayerObservationListProps) {
  const historialRef = useRef<HTMLDivElement>(null)
  const [modoEliminar, setModoEliminar] = useState(false)
  const [idsSeleccionados, setIdsSeleccionados] = useState<string[]>([])
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [accionesPorObservacion, setAccionesPorObservacion] = useState<
    Record<string, AccionObservacion[]>
  >({})
  const [cargandoAcciones, setCargandoAcciones] = useState<Record<string, boolean>>({})

  function desplazarInformeAbierto(elemento: HTMLDetailsElement) {
    if (!elemento.open || !historialRef.current) return

    requestAnimationFrame(() => {
      const historial = historialRef.current
      if (!historial) return

      historial.scrollTo({
        top: Math.max(0, elemento.offsetTop - historial.offsetTop - 8),
        behavior: 'smooth',
      })
    })
  }

  async function manejarAperturaObservacion(observacion: ObservacionJugador) {
    if (observacion.tipo !== 'partido') return
    if (accionesPorObservacion[observacion.id] || cargandoAcciones[observacion.id]) return

    setCargandoAcciones((actual) => ({ ...actual, [observacion.id]: true }))

    try {
      const acciones = await obtenerAccionesObservacion(observacion.id)
      setAccionesPorObservacion((actual) => ({ ...actual, [observacion.id]: acciones }))
    } catch {
      setAccionesPorObservacion((actual) => ({ ...actual, [observacion.id]: [] }))
    } finally {
      setCargandoAcciones((actual) => ({ ...actual, [observacion.id]: false }))
    }
  }

  function manejarToggle(observacion: ObservacionJugador, elemento: HTMLDetailsElement) {
    desplazarInformeAbierto(elemento)

    if (elemento.open) {
      void manejarAperturaObservacion(observacion)
    }
  }

  function alternarSeleccion(id: string) {
    setIdsSeleccionados((idsActuales) =>
      idsActuales.includes(id)
        ? idsActuales.filter((idActual) => idActual !== id)
        : [...idsActuales, id],
    )
  }

  function cancelarEliminacion() {
    setModoEliminar(false)
    setIdsSeleccionados([])
    setErrorEliminacion(null)
  }

  async function eliminarSeleccionadas() {
    if (idsSeleccionados.length === 0) return

    const mensaje = `¿Eliminar ${idsSeleccionados.length} informe${
      idsSeleccionados.length === 1 ? '' : 's'
    }? Esta acción no se puede deshacer.`

    if (!window.confirm(mensaje)) return

    setEliminando(true)
    setErrorEliminacion(null)

    try {
      await onEliminarObservaciones(idsSeleccionados)
      cancelarEliminacion()
    } catch {
      setErrorEliminacion('No se han podido eliminar los informes seleccionados.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <section
      className="card shadow-sm observation-history-card"
      aria-labelledby="observaciones-title"
      style={alturaMaxima ? { height: `${alturaMaxima}px` } : undefined}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <h2 id="observaciones-title" className="h4 mb-0">
            Historial de observaciones
          </h2>
          {modoEliminar ? (
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={eliminando || idsSeleccionados.length === 0}
                type="button"
                onClick={() => void eliminarSeleccionadas()}
              >
                Eliminar ({idsSeleccionados.length})
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={eliminando}
                type="button"
                onClick={cancelarEliminacion}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <span className="text-body-secondary small">
                {observaciones.length} informes
              </span>
              <button
                aria-label="Seleccionar observaciones para eliminar"
                className="history-delete-trigger"
                disabled={observaciones.length === 0}
                title="Eliminar informes"
                type="button"
                onClick={() => setModoEliminar(true)}
              >
                <TrashIcon />
                Borrar
              </button>
            </div>
          )}
        </div>

        {errorEliminacion && (
          <p className="alert alert-danger py-2" role="alert">
            {errorEliminacion}
          </p>
        )}

        {cargando && <HistoryListSkeleton />}

        {error && (
          <p className="alert alert-danger py-2" role="alert">
            {error}
          </p>
        )}

        {!cargando && !error && observaciones.length === 0 && (
          <p className="empty-player-list mb-0 rounded border p-4 text-center text-body-secondary">
            Todavía no hay observaciones para este jugador.
          </p>
        )}

        {!cargando && !error && observaciones.length > 0 && (
          <div className="observation-history-scroll d-grid gap-3" ref={historialRef}>
            {observaciones.map((observacion) => {
              const acciones = accionesPorObservacion[observacion.id] ?? []

              if (editandoId === observacion.id) {
                return (
                  <div className="observation-item observation-item--editing" key={observacion.id}>
                    <ObservationEditForm
                      equipoActualJugador={equipoActualJugador}
                      observacion={observacion}
                      perfilScouting={perfilScouting}
                      onCancelar={() => setEditandoId(null)}
                      onEliminar={async () => {
                        await onEliminarObservaciones([observacion.id])
                        setEditandoId(null)
                      }}
                      onGuardar={async (datos) => {
                        await onActualizarObservacion(observacion.id, datos)
                        setEditandoId(null)
                      }}
                    />
                  </div>
                )
              }

              return (
                <details
                  className="observation-item"
                  key={observacion.id}
                  onToggle={(evento) =>
                    manejarToggle(observacion, evento.currentTarget)
                  }
                >
                  <summary className="observation-summary">
                    {modoEliminar && (
                      <input
                        aria-label={`Seleccionar informe del ${formatearFecha(
                          observacion.fechaObservacion,
                        )}`}
                        checked={idsSeleccionados.includes(observacion.id)}
                        className="history-delete-checkbox"
                        type="checkbox"
                        onChange={() => alternarSeleccion(observacion.id)}
                        onClick={(evento) => evento.stopPropagation()}
                      />
                    )}
                    <span>
                      <strong>{formatearFecha(observacion.fechaObservacion)}</strong>
                      {observacion.tipo && (
                        <span className="badge text-bg-secondary ms-3">
                          {etiquetaTipo[observacion.tipo] ?? observacion.tipo}
                        </span>
                      )}
                      <span className="small text-body-secondary ms-3">
                        {observacion.autorNombre}
                      </span>
                    </span>
                    {!modoEliminar && (
                      <button
                        aria-label="Editar este informe"
                        className="observation-edit-trigger"
                        title="Editar"
                        type="button"
                        onClick={(evento) => {
                          evento.preventDefault()
                          evento.stopPropagation()
                          setEditandoId(observacion.id)
                        }}
                      >
                        <PencilIcon size={14} />
                      </button>
                    )}
                    <span aria-hidden="true" className="observation-toggle">
                      ▸
                    </span>
                  </summary>

                  <div className="observation-content">
                    {observacion.tipo === 'partido' &&
                      (observacion.equipoJugador ||
                        observacion.equipoRival ||
                        observacion.competicion ||
                        observacion.jornada) && (
                        <p className="mb-2 small text-body-secondary">
                          {observacion.equipoJugador ?? '?'} vs{' '}
                          {observacion.equipoRival ?? '?'}
                          {observacion.competicion && ` · ${observacion.competicion}`}
                          {observacion.jornada && ` · ${observacion.jornada}`}
                        </p>
                      )}

                    <div className="mb-2">
                      <FormattedNotes texto={observacion.notas} />
                    </div>

                    {observacion.valoraciones.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 small fw-semibold">
                          Valoraciones del informe ({observacion.valoraciones.length})
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {observacion.valoraciones.map((valoracion) => (
                            <span
                              className="badge observation-score"
                              key={valoracion.criterioNombre}
                            >
                              {valoracion.criterioNombre}: {valoracion.puntuacion}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {observacion.tipo === 'partido' && (
                      <div className="mb-2">
                        {cargandoAcciones[observacion.id] && (
                          <p className="small text-body-secondary mb-0">
                            Cargando acciones registradas…
                          </p>
                        )}
                        {!cargandoAcciones[observacion.id] && acciones.length > 0 && (
                          <>
                            <p className="mb-2 small fw-semibold">
                              Acciones registradas ({acciones.length})
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                              {acciones.map((accion) => (
                                <span className="badge observation-score" key={accion.id}>
                                  {accion.minuto}&apos; {accion.etiquetaNombre}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <p className="mb-0 small text-body-secondary">
                      Registrado el {formatearFecha(observacion.createdAt, true)}
                    </p>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default PlayerObservationList
