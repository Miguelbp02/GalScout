import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoAppOjeo from '../assets/logoAppOjeo.png'
import UsersIcon from './UsersIcon'
import PlusIcon from './PlusIcon'
import ScalesIcon from './ScalesIcon'
import BinocularsIcon from './BinocularsIcon'
import LightbulbIcon from './LightbulbIcon'
import ThemeToggle from './ThemeToggle'

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
        <Link className="app-brand" to="/">
          <div className="app-logo-crop app-logo-crop-header">
            <img src={logoAppOjeo} alt="Logo de Ojeo Galicia" />
          </div>
          <div>
            <h1 className="app-brand-title" aria-label="GalScout">
              <span>Gal</span>
              <span>Scout</span>
            </h1>
          </div>
        </Link>

        {acciones ?? accionesDeSesion}
      </div>

      {mostrarNavegacion && (
        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            end
            to="/"
          >
            <UsersIcon />
            <span>Jugadores</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/jugadores/nuevo"
          >
            <PlusIcon />
            <span>Añadir jugador</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/comparar"
          >
            <ScalesIcon />
            <span>Comparar</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/ojeo-partido"
          >
            <BinocularsIcon />
            <span>Ojear partido</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            to="/mejoras"
          >
            <LightbulbIcon />
            <span>Mejoras</span>
          </NavLink>
          {herramientas}
          <ThemeToggle />
        </nav>
      )}
    </header>
  )
}

export default AppHeader
