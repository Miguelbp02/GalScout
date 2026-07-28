import playerPlaceholder from '../assets/player-placeholder.png'
import { Link } from 'react-router-dom'
import type { Jugador } from '../types/jugador'
import DominantFootIndicator from './DominantFootIndicator'

interface PlayerCardProps {
  jugador: Jugador
}

function PlayerCard({ jugador }: PlayerCardProps) {
  const claseEstado =
    jugador.estado === 'En equipo' ? 'text-bg-success' : 'text-bg-secondary'

  return (
    <Link
      className="player-card-link d-block h-100"
      to={`/jugadores/${jugador.id}`}
      aria-label={`Ver ficha de ${jugador.nombre}`}
    >
      <article className="card h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              <img
                className="player-avatar"
                src={playerPlaceholder}
                alt=""
                aria-hidden="true"
              />
              <h2 className="h5 card-title mb-0">{jugador.nombre}</h2>
            </div>
            <span className={`badge ${claseEstado}`}>{jugador.estado}</span>
          </div>

          <dl className="row mb-0 small">
            <dt className="col-6 text-body-secondary">Edad</dt>
            <dd className="col-6">{jugador.edad} años</dd>

            <dt className="col-6 text-body-secondary">Altura</dt>
            <dd className="col-6">{jugador.alturaCm} cm</dd>

            <dt className="col-6 text-body-secondary">Posición</dt>
            <dd className="col-6">{jugador.posicion}</dd>

            <dt className="col-6 text-body-secondary">Pierna dominante</dt>
            <dd className="col-6 mb-0">
              <DominantFootIndicator piernaDominante={jugador.piernaDominante} />
            </dd>
          </dl>
        </div>
      </article>
    </Link>
  )
}

export default PlayerCard
