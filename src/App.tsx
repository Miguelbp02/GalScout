import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import AppFooter from './components/AppFooter'
import AppHeader from './components/AppHeader'
import LoginForm from './components/LoginForm'
import PlayerFilters from './components/PlayerFilters'
import PlayerForm from './components/PlayerForm'
import PlayerList from './components/PlayerList'
import PlayerListSkeleton from './components/PlayerListSkeleton'
import { supabase } from './lib/supabase'
import PlayerDetailPage from './pages/PlayerDetailPage'
import EditPlayerPage from './pages/EditPlayerPage'
import { crearJugador, obtenerJugadores } from './services/playerService'
import type { Jugador, NuevoJugador } from './types/jugador'
import {
  filtrosJugadoresIniciales,
  limitesFiltrosJugadores,
  type FiltrosJugadores,
} from './types/filtrosJugador'

function App() {
  const navigate = useNavigate()
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [sesion, setSesion] = useState<Session | null>(null)
  const [sesionCargando, setSesionCargando] = useState(true)
  const [jugadoresCargando, setJugadoresCargando] = useState(false)
  const [errorJugadores, setErrorJugadores] = useState<string | null>(null)
  const [filtrosJugadores, setFiltrosJugadores] = useState<FiltrosJugadores>(
    filtrosJugadoresIniciales,
  )
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    async function cargarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSesion(session)
      setSesionCargando(false)
    }

    void cargarSesion()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSesion(session)
      setSesionCargando(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sesion) {
      return
    }

    async function cargarJugadores() {
      setJugadoresCargando(true)
      setErrorJugadores(null)

      try {
        const jugadoresObtenidos = await obtenerJugadores()
        setJugadores(jugadoresObtenidos)
      } catch {
        setErrorJugadores('No se han podido cargar los jugadores.')
      } finally {
        setJugadoresCargando(false)
      }
    }

    void cargarJugadores()
  }, [sesion])

  async function añadirJugador(nuevoJugador: NuevoJugador) {
    const jugadorCreado = await crearJugador(nuevoJugador)
    setJugadores((jugadoresActuales) => [jugadorCreado, ...jugadoresActuales])
    navigate('/')
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  const hayFiltrosActivos =
    Boolean(filtrosJugadores.nombre) ||
    filtrosJugadores.edadMinima !== limitesFiltrosJugadores.edadMinima ||
    filtrosJugadores.edadMaxima !== limitesFiltrosJugadores.edadMaxima ||
    filtrosJugadores.alturaMinima !== limitesFiltrosJugadores.alturaMinima ||
    filtrosJugadores.alturaMaxima !== limitesFiltrosJugadores.alturaMaxima ||
    Boolean(filtrosJugadores.piernaDominante) ||
    Boolean(filtrosJugadores.estado) ||
    Boolean(filtrosJugadores.posicionNatural)
  const jugadoresFiltrados = jugadores.filter((jugador) => {
    const posicionesNaturales = jugador.posicion.split(' · ').map((posicion) => posicion.trim())
    const nombreNormalizado = jugador.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es-ES')
    const busquedaNormalizada = filtrosJugadores.nombre
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es-ES')

    return (
      (!busquedaNormalizada || nombreNormalizado.includes(busquedaNormalizada)) &&
      jugador.edad >= filtrosJugadores.edadMinima &&
      jugador.edad <= filtrosJugadores.edadMaxima &&
      jugador.alturaCm >= filtrosJugadores.alturaMinima &&
      jugador.alturaCm <= filtrosJugadores.alturaMaxima &&
      (!filtrosJugadores.piernaDominante ||
        jugador.piernaDominante === filtrosJugadores.piernaDominante) &&
      (!filtrosJugadores.estado || jugador.estado === filtrosJugadores.estado) &&
      (!filtrosJugadores.posicionNatural ||
        posicionesNaturales.includes(filtrosJugadores.posicionNatural))
    )
  })

  if (sesionCargando) {
    return (
      <main className="login-shell">
        <p className="text-body-secondary">Comprobando sesión…</p>
      </main>
    )
  }

  if (!sesion) {
    return <LoginForm />
  }

  const pantallaPrincipal = (
    <main className="app-shell">
      <AppHeader
        email={sesion.user.email}
        onCerrarSesion={() => void cerrarSesion()}
        herramientas={
          <PlayerFilters
            abierto={filtrosAbiertos}
            filtros={filtrosJugadores}
            integradoEnMenu
            modo="accion"
            onCambiarAbierto={setFiltrosAbiertos}
            onCambiarFiltros={setFiltrosJugadores}
          />
        }
      />

      {jugadoresCargando && <PlayerListSkeleton />}

      {errorJugadores && (
        <p className="alert alert-danger mt-5" role="alert">
          {errorJugadores}
        </p>
      )}

      {!jugadoresCargando && !errorJugadores && (
        <>
          <PlayerFilters
            abierto={filtrosAbiertos}
            className="player-filters--from-menu"
            filtros={filtrosJugadores}
            modo="panel"
            onCambiarAbierto={setFiltrosAbiertos}
            onCambiarFiltros={setFiltrosJugadores}
          />
          <PlayerList
            hayFiltrosActivos={hayFiltrosActivos}
            jugadores={jugadoresFiltrados}
          />
        </>
      )}
      <AppFooter />
    </main>
  )

  const pantallaNuevoJugador = (
    <main className="app-shell">
      <AppHeader
        email={sesion.user.email}
        onCerrarSesion={() => void cerrarSesion()}
        herramientas={
          <PlayerFilters
            abierto={false}
            filtros={filtrosJugadores}
            integradoEnMenu
            modo="accion"
            onCambiarAbierto={(abierto) => {
              if (abierto) {
                setFiltrosAbiertos(true)
                navigate('/')
              }
            }}
            onCambiarFiltros={setFiltrosJugadores}
          />
        }
      />
      <PlayerForm onGuardarJugador={añadirJugador} />
      <AppFooter />
    </main>
  )

  return (
    <Routes>
      <Route path="/" element={pantallaPrincipal} />
      <Route path="/jugadores/nuevo" element={pantallaNuevoJugador} />
      <Route path="/jugadores/:jugadorId/editar" element={<EditPlayerPage />} />
      <Route path="/jugadores/:jugadorId" element={<PlayerDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
