import { useEffect, useState } from 'react'
import { obtenerValoracionesMediasJugador } from '../services/playerRatingsService'
import type {
  GrupoCriterio,
  PerfilScouting,
  ResumenValoracionCriterio,
} from '../types/criterio'

interface PlayerAverageRatingsProps {
  jugadorId: string
  versionActualizacion: number
  perfilScouting: PerfilScouting
}

const grupos: GrupoCriterio[] = ['Físico', 'Técnico', 'Táctico', 'Mental']

type OrdenValoraciones = 'original' | 'descendente' | 'ascendente'

function formatearMedia(media: number) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
  }).format(media)
}

function obtenerClaseNivel(media: number) {
  if (media < 5) return 'rating-level-red'
  if (media < 8) return 'rating-level-orange'
  if (media < 12) return 'rating-level-yellow'
  if (media < 15) return 'rating-level-lime'

  return 'rating-level-green'
}

function PlayerAverageRatings({
  jugadorId,
  versionActualizacion,
  perfilScouting,
}: PlayerAverageRatingsProps) {
  const [valoraciones, setValoraciones] = useState<ResumenValoracionCriterio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orden, setOrden] = useState<OrdenValoraciones>('descendente')

  useEffect(() => {
    async function cargarValoraciones() {
      setCargando(true)
      setError(null)

      try {
        setValoraciones(
          await obtenerValoracionesMediasJugador(jugadorId, perfilScouting),
        )
      } catch {
        setError('No se han podido cargar las valoraciones medias.')
      } finally {
        setCargando(false)
      }
    }

    void cargarValoraciones()
  }, [jugadorId, perfilScouting, versionActualizacion])

  return (
    <section className="player-average-ratings" aria-labelledby="valoraciones-title">
      <div>
        <div className="average-ratings-header">
          <h2 id="valoraciones-title" className="h4 mb-0">
            Valoraciones medias
          </h2>
          <label className="average-sort-control">
            <span>Orden</span>
            <select
              aria-label="Ordenar valoraciones medias"
              className="form-select form-select-sm"
              value={orden}
              onChange={(event) => setOrden(event.target.value as OrdenValoraciones)}
            >
              <option value="original">Original</option>
              <option value="descendente">Mejor a peor</option>
              <option value="ascendente">Peor a mejor</option>
            </select>
          </label>
        </div>
        {cargando && <p className="text-body-secondary mb-0">Cargando valoraciones…</p>}

        {error && (
          <p className="alert alert-danger py-2 mb-0" role="alert">
            {error}
          </p>
        )}

        {!cargando && !error && valoraciones.length === 0 && (
          <p className="empty-player-list mb-0 rounded border p-4 text-center text-body-secondary">
            Todavía no hay atributos valorados para este jugador.
          </p>
        )}

        {!cargando && !error && valoraciones.length > 0 && (
          <div className="row g-3">
            {grupos.map((grupo) => {
              const valoracionesDelGrupo = valoraciones
                .filter((valoracion) => valoracion.grupo === grupo)
                .sort((primera, segunda) => {
                  if (orden === 'descendente') return segunda.media - primera.media
                  if (orden === 'ascendente') return primera.media - segunda.media

                  return 0
                })

              if (valoracionesDelGrupo.length === 0) return null

              return (
                <section className="col-12 col-md-6 col-xxl-3" key={grupo}>
                  <h3 className="h6 text-uppercase text-body-secondary mb-2">
                    {grupo}
                  </h3>
                  <div className="d-grid gap-2">
                    {valoracionesDelGrupo.map((valoracion) => (
                      <div className="average-rating-row" key={valoracion.id}>
                        <div className="average-rating-heading">
                          <span className="average-rating-name">{valoracion.nombre}</span>
                          <small className="text-body-secondary text-end">
                            {valoracion.totalInformes === 1
                              ? '1 informe'
                              : `${valoracion.totalInformes} informes`}
                          </small>
                        </div>
                        <span className="average-rating-data">
                          <strong
                            className={`rating-value ${obtenerClaseNivel(
                              valoracion.media,
                            )}`}
                          >
                            {formatearMedia(valoracion.media)}
                          </strong>
                          <span
                            aria-label={`Media de ${valoracion.nombre}: ${formatearMedia(
                              valoracion.media,
                            )} sobre 20`}
                            aria-valuemax={20}
                            aria-valuemin={0}
                            aria-valuenow={valoracion.media}
                            className="rating-bar"
                            role="progressbar"
                          >
                            <span
                              className={`rating-bar-fill ${obtenerClaseNivel(
                                valoracion.media,
                              )}`}
                              style={{ width: `${(valoracion.media / 20) * 100}%` }}
                            />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default PlayerAverageRatings
