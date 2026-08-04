import { useEsDesarrollador } from '../hooks/useEsDesarrollador'
import { useModoJugadores } from './ModoJugadoresContext'

function ModoJugadoresToggle() {
  const esDesarrollador = useEsDesarrollador()
  const { modo, alternarModo } = useModoJugadores()
  const esFicticios = modo === 'ficticios'

  if (!esDesarrollador) return null

  return (
    <button
      aria-label={
        esFicticios ? 'Cambiar a jugadores reales' : 'Cambiar a jugadores ficticios de prueba'
      }
      aria-pressed={esFicticios}
      className={`modo-jugadores-toggle ${esFicticios ? 'modo-jugadores-toggle--ficticios' : ''}`}
      title={
        esFicticios
          ? 'Viendo jugadores ficticios de prueba. Pulsa para ver los reales.'
          : 'Viendo jugadores reales. Pulsa para ver los ficticios de prueba.'
      }
      type="button"
      onClick={alternarModo}
    >
      <span aria-hidden="true">{esFicticios ? '🧪' : '⚽'}</span>
      <span>{esFicticios ? 'Ficticios' : 'Reales'}</span>
    </button>
  )
}

export default ModoJugadoresToggle
