import { useLocation, useNavigate } from 'react-router-dom'
import { useMatchSession } from './MatchSessionContext'

function FloatingMatchPill() {
  const { sesion } = useMatchSession()
  const navigate = useNavigate()
  const ubicacion = useLocation()

  if (!sesion || ubicacion.pathname === '/ojeo-partido') return null

  const minutoActual = Math.floor(sesion.segundos / 60)

  return (
    <button
      className="floating-match-pill"
      type="button"
      onClick={() => navigate('/ojeo-partido')}
    >
      <i aria-hidden="true" className="floating-match-pill-dot" />
      Partido en curso · {minutoActual}&apos; · {sesion.jugadores.length} jugadores
      <span className="floating-match-pill-link">Volver ›</span>
    </button>
  )
}

export default FloatingMatchPill
