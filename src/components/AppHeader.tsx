import { NavLink } from 'react-router-dom'
import logoAppOjeo from '../assets/logoAppOjeo.png'

interface AppHeaderProps {
  email?: string
  onCerrarSesion?: () => void
}

function AppHeader({ email, onCerrarSesion }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="app-brand">
          <div className="app-logo-crop app-logo-crop-header">
            <img src={logoAppOjeo} alt="Logo de Ojeo Galicia" />
          </div>
          <div>
            <p className="app-kicker">Ojeo</p>
            <h1>Jugadores</h1>
          </div>
        </div>

        {email && onCerrarSesion && (
          <div className="text-end">
            <p className="small text-body-secondary mb-2">{email}</p>
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={onCerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <nav className="app-nav" aria-label="Navegación principal">
        <NavLink
          className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
          end
          to="/"
        >
          Jugadores
        </NavLink>
        <NavLink
          className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
          to="/jugadores/nuevo"
        >
          Añadir jugador
        </NavLink>
      </nav>
    </header>
  )
}

export default AppHeader
