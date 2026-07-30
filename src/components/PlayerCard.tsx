import playerPlaceholder from '../assets/player-placeholder.png'
import { Link } from 'react-router-dom'
import { obtenerAbreviaturaPosicion } from '../constants/positionAbbreviations'
import type { Jugador } from '../types/jugador'
import type { Posicion } from '../types/posicion'

interface PlayerCardProps {
  jugador: Jugador
  posiciones: Posicion[]
}

function IconoInforme() {
  return (
    <svg
      aria-hidden="true"
      className="player-card-report-icon"
      viewBox="0 0 24 24"
    >
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4M8.5 12h7M8.5 15.5h7" />
    </svg>
  )
}

function PlayerCard({ jugador, posiciones }: PlayerCardProps) {
  const claseEstado =
    jugador.estado === 'En equipo' ? 'text-bg-success' : 'text-bg-secondary'
  const textoInformes =
    jugador.totalInformes === 1
      ? '1 informe'
      : `${jugador.totalInformes} informes`
  const posicionesNaturales = posiciones
    .filter((posicion) => jugador.posicionesNaturalesIds.includes(posicion.id))
  const posicionesAptas = posiciones.filter(
    (posicion) =>
      jugador.posicionesAptasIds.includes(posicion.id) &&
      !jugador.posicionesNaturalesIds.includes(posicion.id),
  )

  return (
    <Link
      className="player-card-link d-block h-100"
      to={`/jugadores/${jugador.id}`}
      aria-label={`Ver ficha de ${jugador.nombre}`}
    >
      <article className="card h-100 shadow-sm">
        <div className="card-body">
          <div className="player-card-header">
            <div className="d-flex align-items-center gap-3">
              <img
                className="player-avatar"
                src={playerPlaceholder}
                alt=""
                aria-hidden="true"
              />
              <div>
                <h2 className="h5 card-title mb-1">{jugador.nombre}</h2>
                <p className="player-card-measures mb-0">
                  {jugador.edad} años <span aria-hidden="true">&middot;</span> {jugador.alturaCm} cm
                  {jugador.categoria && (
                    <>
                      <span aria-hidden="true"> &middot; </span>
                      {jugador.categoria}
                    </>
                  )}
                </p>
                {jugador.equipoActual && (
                  <p className="player-card-team mb-0">{jugador.equipoActual}</p>
                )}
              </div>
            </div>
            <span className={`badge ${claseEstado}`}>{jugador.estado}</span>
          </div>

          <div className="player-card-position">
            <span className="player-card-position-label">Posiciones</span>
            <div className="player-card-position-tags">
              {posicionesNaturales.map((posicion) => (
                <span
                  className="player-card-position-tag player-card-position-tag--natural"
                  key={`natural-${posicion.id}`}
                  title={`Natural: ${posicion.nombre}`}
                >
                  {obtenerAbreviaturaPosicion(posicion.codigo)}
                </span>
              ))}
              {posicionesAptas.map((posicion) => (
                <span
                  className="player-card-position-tag player-card-position-tag--apta"
                  key={`apta-${posicion.id}`}
                  title={`Apta: ${posicion.nombre}`}
                >
                  {obtenerAbreviaturaPosicion(posicion.codigo)}
                </span>
              ))}
              {posicionesNaturales.length === 0 && posicionesAptas.length === 0 && (
                <span className="player-card-position-empty">Sin indicar</span>
              )}
            </div>
          </div>

          <div className="player-card-footer">
            <span className="player-card-report-count">
              <IconoInforme />
              {textoInformes}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default PlayerCard
