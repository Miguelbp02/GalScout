import { useState } from 'react'
import HistoryListSkeleton from './HistoryListSkeleton'
import TrashIcon from './TrashIcon'
import type { ValoracionGeneral } from '../types/valoracionGeneral'

interface GeneralRatingListProps {
  cargando: boolean
  error: string | null
  onEliminarValoraciones: (ids: string[]) => Promise<void>
  valoraciones: ValoracionGeneral[]
}

function formatearFecha(fecha: string, incluirHora = false) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    ...(incluirHora ? { timeStyle: 'short' } : {}),
  }).format(new Date(fecha))
}

function obtenerClaseNivel(puntuacion: number) {
  if (puntuacion < 5) return 'rating-level-red'
  if (puntuacion < 8) return 'rating-level-orange'
  if (puntuacion < 12) return 'rating-level-yellow'
  if (puntuacion < 15) return 'rating-level-lime'

  return 'rating-level-green'
}

function GeneralRatingList({
  cargando,
  error,
  onEliminarValoraciones,
  valoraciones,
}: GeneralRatingListProps) {
  const [modoEliminar, setModoEliminar] = useState(false)
  const [idsSeleccionados, setIdsSeleccionados] = useState<string[]>([])

  function alternarSeleccion(id: string) {
    setIdsSeleccionados((idsActuales) =>
      idsActuales.includes(id)
        ? idsActuales.filter((idActual) => idActual !== id)
        : [...idsActuales, id],
    )
  }

  async function eliminarSeleccionadas() {
    if (idsSeleccionados.length === 0) return
    if (!window.confirm(`¿Eliminar ${idsSeleccionados.length} valoración${idsSeleccionados.length === 1 ? '' : 'es'}? Esta acción no se puede deshacer.`)) return

    await onEliminarValoraciones(idsSeleccionados)
    setIdsSeleccionados([])
    setModoEliminar(false)
  }

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <h3 className="h5 mb-0">Historial de valoraciones generales</h3>
        {modoEliminar ? (
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={idsSeleccionados.length === 0}
              type="button"
              onClick={() => void eliminarSeleccionadas()}
            >
              Eliminar ({idsSeleccionados.length})
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              type="button"
              onClick={() => {
                setIdsSeleccionados([])
                setModoEliminar(false)
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-body-secondary">
              {valoraciones.length} registros
            </span>
            <button
              aria-label="Seleccionar valoraciones generales para eliminar"
              className="history-delete-trigger"
              disabled={valoraciones.length === 0}
              title="Eliminar valoraciones"
              type="button"
              onClick={() => setModoEliminar(true)}
            >
              <TrashIcon />
              Borrar
            </button>
          </div>
        )}
      </div>

      {cargando && <HistoryListSkeleton className="general-rating-item" />}

      {error && (
        <p className="alert alert-danger py-2" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && valoraciones.length === 0 && (
        <p className="empty-player-list mb-0 rounded border p-3 text-center text-body-secondary">
          Todavía no hay valoraciones generales.
        </p>
      )}

      {!cargando && !error && valoraciones.length > 0 && (
        <div className="d-grid gap-2">
          {valoraciones.map((valoracion) => (
            <details className="general-rating-item" key={valoracion.id}>
              <summary className="general-rating-summary">
                {modoEliminar && (
                  <input
                    aria-label={`Seleccionar valoración del ${formatearFecha(
                      valoracion.fechaValoracion,
                    )}`}
                    checked={idsSeleccionados.includes(valoracion.id)}
                    className="history-delete-checkbox"
                    type="checkbox"
                    onChange={() => alternarSeleccion(valoracion.id)}
                    onClick={(evento) => evento.stopPropagation()}
                  />
                )}
                <span>
                  <strong>{formatearFecha(valoracion.fechaValoracion)}</strong>
                  <span className="small text-body-secondary ms-3">
                    {valoracion.autorNombre}
                  </span>
                </span>
                <span className="d-flex align-items-center gap-3">
                  <span
                    className={`general-rating-score ${obtenerClaseNivel(
                      valoracion.puntuacion,
                    )}`}
                  >
                    {valoracion.puntuacion} / 20
                  </span>
                  <span aria-hidden="true" className="observation-toggle">
                    ▸
                  </span>
                </span>
              </summary>
              <div className="general-rating-content">
                {valoracion.comentario ? (
                  <p className="mb-2 observation-notes">{valoracion.comentario}</p>
                ) : (
                  <p className="mb-2 text-body-secondary">Sin comentario.</p>
                )}
                <p className="mb-0 small text-body-secondary">
                  Registrado el {formatearFecha(valoracion.createdAt, true)}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

export default GeneralRatingList
