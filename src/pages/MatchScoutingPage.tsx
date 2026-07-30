import { useNavigate } from 'react-router-dom'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import MatchNotebook from '../components/MatchNotebook'
import MatchPitchCapture from '../components/MatchPitchCapture'
import MatchSetupForm from '../components/MatchSetupForm'
import MatchTimerBar from '../components/MatchTimerBar'
import { useMatchSession } from '../components/MatchSessionContext'

function MatchScoutingPage() {
  const navigate = useNavigate()
  const { sesion, cerrarSesion } = useMatchSession()

  if (!sesion) {
    return (
      <main className="app-shell">
        <AppHeader />
        <div className="mt-4">
          <h2 className="h3 mb-1">Ojear partido</h2>
          <p className="text-body-secondary mb-0">
            Registra en directo las acciones de hasta 4 jugadores durante un partido.
          </p>
          <MatchSetupForm />
        </div>
        <AppFooter />
      </main>
    )
  }

  function cerrarYVolver() {
    if (cerrarSesion()) {
      navigate('/')
    }
  }

  return (
    <main className="match-fullscreen">
      <MatchTimerBar onCerrar={cerrarYVolver} onMinimizar={() => navigate('/')} />
      <div className="match-main-area">
        <MatchPitchCapture />
        <MatchNotebook />
      </div>
    </main>
  )
}

export default MatchScoutingPage
