import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import logoAppOjeo from '../assets/logoAppOjeo.png'

interface AppHeaderProps {
  email?: string
  onCerrarSesion?: () => void
  herramientas?: ReactNode
  acciones?: ReactNode
  mostrarNavegacion?: boolean
  className?: string
}

function AppHeader({
  email,
  onCerrarSesion,
  herramientas,
  acciones,
  mostrarNavegacion = true,
  className = '',
}: AppHeaderProps) {
  const accionesDeSesion =
    email && onCerrarSesion ? (
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
    ) : null

  return (
    <header
      className={`app-header ${mostrarNavegacion ? 'app-header--with-nav' : ''} ${className}`}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="app-brand">
          <div className="app-logo-crop app-logo-crop-header">
            <img src={logoAppOjeo} alt="Logo de Ojeo Galicia" />
          </div>
          <div>
            <h1 className="app-brand-title" aria-label="GalScout">
              <span>Gal</span>
              <span>Scout</span>
            </h1>
          </div>
        </div>

        {acciones ?? accionesDeSesion}
      </div>

      {mostrarNavegacion && (
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
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/comparar"
          >
            Comparar
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/ojeo-partido"
          >
            Ojear partido
          </NavLink>
          {herramientas}
        </nav>
      )}
    </header>
  )
}

export default AppHeader
