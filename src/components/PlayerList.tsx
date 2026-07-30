import { useEffect, useState } from 'react'
import { obtenerPosiciones } from '../services/positionService'
import type { FiltrosJugadores } from '../types/filtrosJugador'
import type { Jugador } from '../types/jugador'
import type { Posicion } from '../types/posicion'
import PlayerCard from './PlayerCard'
import PlayerFilters from './PlayerFilters'

interface PlayerListProps {
  jugadores: Jugador[]
  hayFiltrosActivos?: boolean
  filtros: FiltrosJugadores
  onCambiarFiltros: (filtros: FiltrosJugadores) => void
  filtrosAbiertos: boolean
  onCambiarFiltrosAbiertos: (abierto: boolean) => void
}

function PlayerList({
  jugadores,
  hayFiltrosActivos = false,
  filtros,
  onCambiarFiltros,
  filtrosAbiertos,
  onCambiarFiltrosAbiertos,
}: PlayerListProps) {
  const [posiciones, setPosiciones] = useState<Posicion[]>([])

  useEffect(() => {
    obtenerPosiciones()
      .then(setPosiciones)
      .catch(() => setPosiciones([]))
  }, [])

  return (
    <section className="py-5" aria-labelledby="player-list-title">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 id="player-list-title" className="h4 mb-0">
          Jugadores registrados
        </h2>
        <div className="d-flex align-items-center gap-2">
          <span className="text-body-secondary">
            {jugadores.length} jugadores
          </span>
          <PlayerFilters
            abierto={filtrosAbiertos}
            filtros={filtros}
            modo="accion"
            varianteBoton="icono"
            onCambiarAbierto={onCambiarFiltrosAbiertos}
            onCambiarFiltros={onCambiarFiltros}
          />
        </div>
      </div>

      <div className="row g-4">
        {jugadores.length === 0 ? (
          <div className="col-12">
            <p className="empty-player-list mb-0 rounded border p-4 text-center text-body-secondary">
              {hayFiltrosActivos
                ? 'No hay jugadores que cumplan los filtros seleccionados.'
                : 'Todavía no hay jugadores registrados en Supabase.'}
            </p>
          </div>
        ) : (
          jugadores.map((jugador) => (
            <div
              className="col-12 col-md-6 col-lg-4"
              key={jugador.id}
            >
              <PlayerCard jugador={jugador} posiciones={posiciones} />
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default PlayerList
