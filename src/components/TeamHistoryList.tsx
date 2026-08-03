import { useState } from 'react'
import HistoryListSkeleton from './HistoryListSkeleton'
import TrashIcon from './TrashIcon'
import { obtenerTemporadasRecientes } from '../constants/temporadas'
import type { HistorialEquipoJugador } from '../types/historialEquipo'

const TEMPORADA_ACTUAL = obtenerTemporadasRecientes()[0]

interface TeamHistoryListProps {
  cargando: boolean
  error: string | null
  historial: HistorialEquipoJugador[]
  onEliminarHistorial: (ids: string[]) => Promise<void>
}

function TeamHistoryList({
  cargando,
  error,
  historial,
  onEliminarHistorial,
}: TeamHistoryListProps) {
  const [modoEliminar, setModoEliminar] = useState(false)
  const [idsSeleccionados, setIdsSeleccionados] = useState<string[]>([])
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null)

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

    const mensaje = `¿Eliminar ${idsSeleccionados.length} etapa${
      idsSeleccionados.length === 1 ? '' : 's'
    } del historial? Esta acción no se puede deshacer.`

    if (!window.confirm(mensaje)) return

    setEliminando(true)
    setErrorEliminacion(null)

    try {
      await onEliminarHistorial(idsSeleccionados)
      cancelarEliminacion()
    } catch {
      setErrorEliminacion('No se han podido eliminar las etapas seleccionadas.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <h3 className="h5 mb-0">Trayectoria por equipos</h3>
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
            <span className="small text-body-secondary">{historial.length} etapas</span>
            <button
              aria-label="Seleccionar etapas del historial para eliminar"
              className="history-delete-trigger"
              disabled={historial.length === 0}
              title="Eliminar etapas"
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

      {cargando && <HistoryListSkeleton className="general-rating-item" />}

      {error && (
        <p className="alert alert-danger py-2" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && historial.length === 0 && (
        <p className="empty-player-list mb-0 rounded border p-3 text-center text-body-secondary">
          Todavía no hay etapas registradas en el historial de este jugador.
        </p>
      )}

      {!cargando && !error && historial.length > 0 && (
        <div className="d-grid gap-2">
          {historial.map((etapa) => (
            <details className="general-rating-item" key={etapa.id}>
              <summary className="general-rating-summary">
                {modoEliminar && (
                  <input
                    aria-label={`Seleccionar etapa en ${etapa.equipoNombre}`}
                    checked={idsSeleccionados.includes(etapa.id)}
                    className="history-delete-checkbox"
                    type="checkbox"
                    onChange={() => alternarSeleccion(etapa.id)}
                    onClick={(evento) => evento.stopPropagation()}
                  />
                )}
                <span>
                  <strong>{etapa.equipoNombre}</strong>
                  {etapa.esActual && (
                    <span className="badge text-bg-success ms-3">Actual</span>
                  )}
                </span>
                <span className="d-flex align-items-center gap-3">
                  {(etapa.temporada || etapa.esActual) && (
                    <span className="small text-body-secondary">
                      {etapa.temporada || TEMPORADA_ACTUAL}
                    </span>
                  )}
                  {(etapa.goles !== null || etapa.partidos !== null) && (
                    <span className="small text-body-secondary">
                      {etapa.goles !== null && `${etapa.goles} goles`}
                      {etapa.goles !== null && etapa.partidos !== null && ' · '}
                      {etapa.partidos !== null && `${etapa.partidos} partidos`}
                    </span>
                  )}
                  <span aria-hidden="true" className="observation-toggle">
                    ▸
                  </span>
                </span>
              </summary>
              <div className="general-rating-content">
                {(etapa.categoria || etapa.liga || etapa.grupoProvincia || etapa.dorsal !== null) && (
                  <p className="small text-body-secondary mb-2">
                    {[
                      etapa.categoria,
                      etapa.liga,
                      etapa.grupoProvincia,
                      etapa.dorsal !== null ? `Dorsal ${etapa.dorsal}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {etapa.notas ? (
                  <p className="mb-0 observation-notes">{etapa.notas}</p>
                ) : (
                  <p className="mb-0 text-body-secondary">Sin notas.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamHistoryList
