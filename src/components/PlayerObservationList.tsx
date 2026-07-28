import type { ObservacionJugador } from '../types/observacion'

interface PlayerObservationListProps {
  cargando: boolean
  error: string | null
  observaciones: ObservacionJugador[]
}

function formatearFecha(fecha: string, incluirHora = false) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    ...(incluirHora ? { timeStyle: 'short' } : {}),
  }).format(new Date(fecha))
}

function PlayerObservationList({
  cargando,
  error,
  observaciones,
}: PlayerObservationListProps) {
  return (
    <section className="card h-100 shadow-sm" aria-labelledby="observaciones-title">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <h2 id="observaciones-title" className="h4 mb-0">
            Historial de observaciones
          </h2>
          <span className="text-body-secondary small">
            {observaciones.length} informes
          </span>
        </div>

        {cargando && <p className="text-body-secondary">Cargando observaciones…</p>}

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
          <div className="d-grid gap-3">
            {observaciones.map((observacion) => (
              <details className="observation-item" key={observacion.id}>
                <summary className="observation-summary">
                  <strong>{formatearFecha(observacion.fechaObservacion)}</strong>
                  <span className="d-flex align-items-center gap-3">
                    <span className="small text-body-secondary">
                      {observacion.autorNombre}
                    </span>
                    <span aria-hidden="true" className="observation-toggle">
                      ▸
                    </span>
                  </span>
                </summary>

                <div className="observation-content">
                  <p className="mb-2 observation-notes">{observacion.notas}</p>
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
                  <p className="mb-0 small text-body-secondary">
                    Registrado el {formatearFecha(observacion.createdAt, true)}
                  </p>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PlayerObservationList
