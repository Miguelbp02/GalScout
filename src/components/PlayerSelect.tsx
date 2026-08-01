import { useEffect, useRef, useState } from 'react'
import { obtenerAbreviaturaPosicion } from '../constants/positionAbbreviations'
import type { Jugador } from '../types/jugador'
import type { Posicion } from '../types/posicion'

interface PlayerSelectProps {
  jugadores: Jugador[]
  posiciones: Posicion[]
  id: string
  valor: string
  textoVacio: string
  disabled?: boolean
  onCambiar: (jugadorId: string) => void
}

function PlayerSelect({
  jugadores,
  posiciones,
  id,
  valor,
  textoVacio,
  disabled = false,
  onCambiar,
}: PlayerSelectProps) {
  const [abierto, setAbierto] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const jugadorSeleccionado = jugadores.find((jugador) => jugador.id === valor)

  function abreviaturasNaturales(jugador: Jugador) {
    return posiciones
      .filter((posicion) => jugador.posicionesNaturalesIds.includes(posicion.id))
      .sort((primera, segunda) => primera.orden - segunda.orden)
      .map((posicion) => obtenerAbreviaturaPosicion(posicion.codigo))
  }

  function seleccionarJugador(jugadorId: string) {
    onCambiar(jugadorId)
    setAbierto(false)
  }

  useEffect(() => {
    function cerrarAlPulsarFuera(evento: PointerEvent) {
      if (!selectorRef.current?.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }

    document.addEventListener('pointerdown', cerrarAlPulsarFuera)
    return () => document.removeEventListener('pointerdown', cerrarAlPulsarFuera)
  }, [])

  return (
    <div ref={selectorRef} className="player-select">
      <button
        aria-controls={`${id}-opciones`}
        aria-expanded={abierto}
        className="player-select-trigger"
        disabled={disabled}
        id={id}
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') setAbierto(false)
        }}
      >
        <span className="player-select-name">{jugadorSeleccionado?.nombre ?? textoVacio}</span>
        {jugadorSeleccionado && (
          <span className="player-select-positions">
            {abreviaturasNaturales(jugadorSeleccionado).map((abreviatura) => (
              <span
                className="player-card-position-tag player-card-position-tag--natural"
                key={abreviatura}
              >
                {abreviatura}
              </span>
            ))}
          </span>
        )}
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div
          aria-labelledby={id}
          className="player-select-options"
          id={`${id}-opciones`}
          role="listbox"
        >
          <button
            aria-selected={!valor}
            className="player-select-option"
            role="option"
            type="button"
            onClick={() => seleccionarJugador('')}
          >
            <span className="player-select-name">{textoVacio}</span>
          </button>
          {jugadores.map((jugador) => (
            <button
              aria-selected={jugador.id === valor}
              className="player-select-option"
              key={jugador.id}
              role="option"
              type="button"
              onClick={() => seleccionarJugador(jugador.id)}
            >
              <span className="player-select-name">{jugador.nombre}</span>
              <span className="player-select-positions">
                {abreviaturasNaturales(jugador).map((abreviatura) => (
                  <span
                    className="player-card-position-tag player-card-position-tag--natural"
                    key={abreviatura}
                  >
                    {abreviatura}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlayerSelect
