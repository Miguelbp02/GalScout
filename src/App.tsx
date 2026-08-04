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
import TeamHistoryForm from './components/TeamHistoryForm'
import { supabase } from './lib/supabase'
import PlayerDetailPage from './pages/PlayerDetailPage'
import EditPlayerPage from './pages/EditPlayerPage'
import ComparePlayersPage from './pages/ComparePlayersPage'
import MatchScoutingPage from './pages/MatchScoutingPage'
import SuggestionsPage from './pages/SuggestionsPage'
import FloatingMatchPill from './components/FloatingMatchPill'
import { crearJugador, obtenerJugadores } from './services/playerService'
import { crearHistorialEquipo } from './services/teamHistoryService'
import { obtenerTemporadasRecientes } from './constants/temporadas'
import type { Jugador, NuevoJugador } from './types/jugador'
import type { NuevoHistorialEquipo } from './types/historialEquipo'
import {
  filtrosJugadoresIniciales,
  limitesFiltrosJugadores,
  type FiltrosJugadores,
} from './types/filtrosJugador'

type PestanaNuevoJugador = 'datos' | 'historial'

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
  const [pestanaNuevoJugador, setPestanaNuevoJugador] = useState<PestanaNuevoJugador>('datos')
  const [historialNuevoJugador, setHistorialNuevoJugador] = useState<NuevoHistorialEquipo[]>([])

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

  async function añadirJugador(
    nuevoJugador: NuevoJugador,
    historialPendiente: NuevoHistorialEquipo[] = [],
  ) {
    const jugadorCreado = await crearJugador(nuevoJugador)

    for (const historial of historialPendiente) {
      await crearHistorialEquipo(jugadorCreado.id, historial)
    }

    const yaHayEtapaActual = historialPendiente.some((historial) => historial.marcarComoActual)

    if (
      !yaHayEtapaActual &&
      nuevoJugador.estado === 'En equipo' &&
      nuevoJugador.equipoActual.trim()
    ) {
      await crearHistorialEquipo(jugadorCreado.id, {
        nombreEquipo: nuevoJugador.equipoActual,
        temporada: obtenerTemporadasRecientes()[0],
        categoria: nuevoJugador.categoria,
        liga: '',
        grupoProvincia: '',
        dorsal: null,
        goles: null,
        partidos: null,
        notas: '',
        marcarComoActual: true,
      })
    }

    setJugadores((jugadoresActuales) => [jugadorCreado, ...jugadoresActuales])
    setHistorialNuevoJugador([])
    setPestanaNuevoJugador('datos')
    navigate('/')
  }

  async function añadirHistorialNuevoJugador(historial: NuevoHistorialEquipo) {
    setHistorialNuevoJugador((historialActual) => [...historialActual, historial])
  }

  function eliminarHistorialNuevoJugador(indice: number) {
    setHistorialNuevoJugador((historialActual) =>
      historialActual.filter((_, indiceActual) => indiceActual !== indice),
    )
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
    Boolean(filtrosJugadores.posicionNatural) ||
    filtrosJugadores.soloFicticios
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
      Boolean(jugador.esFicticio) === filtrosJugadores.soloFicticios &&
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

  if (filtrosJugadores.orden === 'edad-asc') {
    jugadoresFiltrados.sort((jugadorA, jugadorB) => jugadorA.edad - jugadorB.edad)
  }

  if (filtrosJugadores.orden === 'edad-desc') {
    jugadoresFiltrados.sort((jugadorA, jugadorB) => jugadorB.edad - jugadorA.edad)
  }

  if (filtrosJugadores.orden === 'altura-asc') {
    jugadoresFiltrados.sort((jugadorA, jugadorB) => jugadorA.alturaCm - jugadorB.alturaCm)
  }

  if (filtrosJugadores.orden === 'altura-desc') {
    jugadoresFiltrados.sort((jugadorA, jugadorB) => jugadorB.alturaCm - jugadorA.alturaCm)
  }

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
      />

      {filtrosJugadores.soloFicticios && (
        <p className="alert alert-warning mt-4 mb-0" role="status">
          Viendo solo jugadores ficticios de prueba. Estos jugadores no son reales.
        </p>
      )}

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
            filtros={filtrosJugadores}
            filtrosAbiertos={filtrosAbiertos}
            hayFiltrosActivos={hayFiltrosActivos}
            jugadores={jugadoresFiltrados}
            onCambiarFiltros={setFiltrosJugadores}
            onCambiarFiltrosAbiertos={setFiltrosAbiertos}
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
      />
      <div className="mt-4">
        <h2 className="h3 mb-1">Añadir jugador</h2>
        <p className="text-body-secondary mb-0">
          Completa los datos y añade etapas al historial si las conoces.
        </p>
      </div>
      <section
        className={`card player-detail-summary player-detail-summary--${pestanaNuevoJugador} mt-4 shadow-sm`}
      >
        <div className="card-body p-3">
          <nav
            aria-label="Secciones para añadir un jugador"
            className="player-detail-tabs"
            role="tablist"
          >
            {(
              [
                ['datos', 'Datos'],
                ['historial', 'Historial'],
              ] as const
            ).map(([pestana, etiqueta]) => (
              <button
                aria-selected={pestanaNuevoJugador === pestana}
                className={`player-detail-tab ${
                  pestanaNuevoJugador === pestana ? 'active' : ''
                }`}
                key={pestana}
                role="tab"
                type="button"
                onClick={() => setPestanaNuevoJugador(pestana)}
              >
                {etiqueta}
              </button>
            ))}
          </nav>

          {pestanaNuevoJugador === 'datos' && (
            <PlayerForm
              historialPendiente={historialNuevoJugador}
              sinTarjeta
              onGuardarJugador={añadirJugador}
            />
          )}

          {pestanaNuevoJugador === 'historial' && (
            <section role="tabpanel">
              <h2 className="h5 mb-2">Añadir al historial deportivo</h2>
              <p className="text-body-secondary small mb-4">
                Las etapas se guardarán junto con el jugador al confirmar los datos.
              </p>
              <TeamHistoryForm
                mensajeExito="Etapa añadida pendiente de guardar"
                textoBoton="Añadir etapa"
                onCrearHistorial={añadirHistorialNuevoJugador}
              />

              {historialNuevoJugador.length > 0 && (
                <div className="d-grid gap-2 mt-4">
                  {historialNuevoJugador.map((historial, indice) => (
                    <div
                      className="general-rating-item d-flex align-items-center justify-content-between gap-3"
                      key={`${historial.nombreEquipo}-${indice}`}
                    >
                      <span>
                        <strong>{historial.nombreEquipo}</strong>
                        {historial.temporada && (
                          <span className="small text-body-secondary ms-3">
                            {historial.temporada}
                          </span>
                        )}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        type="button"
                        onClick={() => eliminarHistorialNuevoJugador(indice)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
      <AppFooter />
    </main>
  )

  return (
    <>
      <Routes>
        <Route path="/" element={pantallaPrincipal} />
        <Route path="/jugadores/nuevo" element={pantallaNuevoJugador} />
        <Route path="/comparar" element={<ComparePlayersPage />} />
        <Route path="/ojeo-partido" element={<MatchScoutingPage />} />
        <Route path="/mejoras" element={<SuggestionsPage />} />
        <Route path="/jugadores/:jugadorId/editar" element={<EditPlayerPage />} />
        <Route path="/jugadores/:jugadorId" element={<PlayerDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingMatchPill />
    </>
  )
}

export default App
