import { useMemo } from 'react'
import { obtenerClaseNivel } from '../constants/nivelesValoracion'
import { calcularPorPartido } from '../services/playerStatsService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { ObservacionJugador } from '../types/observacion'

interface PlayerStatsMatchesViewProps {
  acciones: AccionObservacionDePartido[]
  /** Partidos de la selección activa, en orden descendente por fecha. */
  partidos: ObservacionJugador[]
  onElegirPartido: (observacionId: string) => void
}

function formatearFechaCorta(fecha: string) {
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  const [, mes, dia] = partes
  return `${dia}/${mes}`
}

function mediaValoraciones(partido: ObservacionJugador) {
  if (partido.valoraciones.length === 0) return null
  const suma = partido.valoraciones.reduce(
    (acumulado, valoracion) => acumulado + valoracion.puntuacion,
    0,
  )
  return suma / partido.valoraciones.length
}

function PlayerStatsMatchesView({
  acciones,
  partidos,
  onElegirPartido,
}: PlayerStatsMatchesViewProps) {
  const porPartido = useMemo(() => calcularPorPartido(acciones), [acciones])

  // El array llega descendente porque la lista de informes se lee de lo más
  // reciente a lo más antiguo, pero una evolución solo se entiende de
  // izquierda a derecha en el tiempo.
  const cronologico = useMemo(() => [...partidos].reverse(), [partidos])

  const maximo = Math.max(
    1,
    ...cronologico.map((partido) => {
      const resumen = porPartido.get(partido.id)
      return Math.max(resumen?.positivas ?? 0, resumen?.negativas ?? 0)
    }),
  )

  const partidosSinAcciones = cronologico.filter(
    (partido) => (porPartido.get(partido.id)?.total ?? 0) === 0,
  ).length

  return (
    <div className="player-stats-vista">
      <section className="player-stats-bloque" aria-labelledby="stats-consistencia-titulo">
        <div className="player-stats-bloque-cabecera">
          <h3 className="player-stats-bloque-titulo" id="stats-consistencia-titulo">
            Partido a partido
          </h3>
          <p className="player-stats-bloque-ayuda">
            Distingue al jugador regular del que tuvo un buen día. Pulsa un partido para ver solo
            ese.
          </p>
        </div>

        <div className="player-stats-consistencia">
          {cronologico.map((partido) => {
            const resumen = porPartido.get(partido.id)
            const positivas = resumen?.positivas ?? 0
            const negativas = resumen?.negativas ?? 0
            const media = mediaValoraciones(partido)
            const descripcion = [
              formatearFechaCorta(partido.fechaObservacion),
              partido.equipoRival ? `contra ${partido.equipoRival}` : null,
              partido.competicion,
              partido.jornada,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <button
                aria-label={`Ver solo el partido del ${descripcion} — ${positivas} ${
                  positivas === 1 ? 'acción positiva' : 'acciones positivas'
                } y ${negativas} ${negativas === 1 ? 'negativa' : 'negativas'}`}
                className="player-stats-consistencia-columna"
                key={partido.id}
                title={descripcion}
                type="button"
                onClick={() => onElegirPartido(partido.id)}
              >
                <span className="player-stats-consistencia-positivas">
                  <span
                    className="player-stats-consistencia-barra player-stats-consistencia-barra--positiva"
                    style={{ height: `${(positivas / maximo) * 100}%` }}
                  />
                </span>

                <span aria-hidden="true" className="player-stats-consistencia-eje" />

                <span className="player-stats-consistencia-negativas">
                  <span
                    className="player-stats-consistencia-barra player-stats-consistencia-barra--negativa"
                    style={{ height: `${(negativas / maximo) * 100}%` }}
                  />
                </span>

                {media === null ? (
                  <span className="player-stats-consistencia-nota player-stats-consistencia-nota--vacia">
                    —
                  </span>
                ) : (
                  <strong
                    className={`player-stats-consistencia-nota rating-value ${obtenerClaseNivel(media)}`}
                  >
                    {media.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
                  </strong>
                )}

                <span className="player-stats-consistencia-fecha">
                  {formatearFechaCorta(partido.fechaObservacion)}
                </span>
              </button>
            )
          })}
        </div>

        <ul className="player-stats-timeline-leyenda">
          <li>
            <i
              aria-hidden="true"
              className="player-stats-split-punto player-stats-split-punto--positiva"
            />
            Acciones positivas
          </li>
          <li>
            <i
              aria-hidden="true"
              className="player-stats-split-punto player-stats-split-punto--negativa"
            />
            Acciones negativas
          </li>
          <li className="player-stats-timeline-leyenda-nota">
            La píldora es la media de tus valoraciones de ese informe.
          </li>
        </ul>

        {partidosSinAcciones > 0 && (
          <p className="player-stats-aviso" role="note">
            {partidosSinAcciones} de {cronologico.length} partidos no tienen ninguna acción
            registrada: cuentan como cero y bajan todas las medias por partido.
          </p>
        )}
      </section>
    </div>
  )
}

export default PlayerStatsMatchesView
