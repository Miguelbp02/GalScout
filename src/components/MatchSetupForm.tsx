import { useEffect, useId, useMemo, useState } from 'react'
import { obtenerJugadores } from '../services/playerService'
import { obtenerPosiciones } from '../services/positionService'
import { obtenerEquipos } from '../services/teamService'
import { useMatchSession } from './MatchSessionContext'
import PlayerSelect from './PlayerSelect'
import type { PerfilScouting } from '../types/criterio'
import type { Jugador } from '../types/jugador'
import type { EquipoSesion, JugadorSeguido, LadoCampo } from '../types/matchSession'
import { COLORES_JUGADOR } from '../types/matchSession'
import type { Posicion } from '../types/posicion'

const MAXIMO_JUGADORES = 4

function MatchSetupForm() {
  const { iniciarPartido } = useMatchSession()
  const idListaEquipos = useId()

  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [nombresEquipos, setNombresEquipos] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)

  const [seleccionados, setSeleccionados] = useState<
    { jugador: Jugador; equipo: EquipoSesion }[]
  >([])
  const [nombreEquipoA, setNombreEquipoA] = useState('')
  const [nombreEquipoB, setNombreEquipoB] = useState('')
  const [competicion, setCompeticion] = useState('')
  const [jornada, setJornada] = useState('')
  const [ladoEquipoA, setLadoEquipoA] = useState<LadoCampo>('izquierda')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)

      try {
        const [jugadoresObtenidos, posicionesObtenidas, equiposObtenidos] =
          await Promise.all([obtenerJugadores(), obtenerPosiciones(), obtenerEquipos()])
        setJugadores(jugadoresObtenidos)
        setPosiciones(posicionesObtenidas)
        setNombresEquipos(equiposObtenidos.map((equipo) => equipo.nombre))
      } catch {
        setError('No se han podido cargar los jugadores.')
      } finally {
        setCargando(false)
      }
    }

    void cargarDatos()
  }, [])

  const posicionPorteroId = useMemo(
    () => posiciones.find((posicion) => posicion.codigo === 'portero')?.id,
    [posiciones],
  )

  function perfilDeJugador(jugador: Jugador): PerfilScouting {
    return posicionPorteroId !== undefined &&
      jugador.posicionesNaturalesIds.includes(posicionPorteroId)
      ? 'portero'
      : 'campo'
  }

  const idsSeleccionados = new Set(seleccionados.map((item) => item.jugador.id))

  const opcionesDisponibles = jugadores
    .filter((jugador) => !idsSeleccionados.has(jugador.id))
    .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'))

  function añadirJugadorPorId(jugadorId: string) {
    if (!jugadorId || seleccionados.length >= MAXIMO_JUGADORES) return

    const jugador = jugadores.find((item) => item.id === jugadorId)
    if (!jugador) return

    setSeleccionados((actuales) => [...actuales, { jugador, equipo: 'A' }])
  }

  function quitarJugador(jugadorId: string) {
    setSeleccionados((actuales) =>
      actuales.filter((item) => item.jugador.id !== jugadorId),
    )
  }

  function cambiarEquipoDeJugador(jugadorId: string) {
    setSeleccionados((actuales) =>
      actuales.map((item) =>
        item.jugador.id === jugadorId
          ? { ...item, equipo: item.equipo === 'A' ? 'B' : 'A' }
          : item,
      ),
    )
  }

  function empezarPartido() {
    if (seleccionados.length === 0) {
      setError('Selecciona al menos un jugador para seguir.')
      return
    }

    if (!nombreEquipoA.trim() || !nombreEquipoB.trim()) {
      setError('Indica los dos equipos que se enfrentan.')
      return
    }

    setError(null)

    const jugadoresSeguidos: JugadorSeguido[] = seleccionados.map((item, indice) => ({
      id: item.jugador.id,
      nombre: item.jugador.nombre,
      perfilScouting: perfilDeJugador(item.jugador),
      equipo: item.equipo,
      color: COLORES_JUGADOR[indice % COLORES_JUGADOR.length],
    }))

    iniciarPartido({
      jugadores: jugadoresSeguidos,
      nombreEquipoA: nombreEquipoA.trim().toLocaleUpperCase('es-ES'),
      nombreEquipoB: nombreEquipoB.trim().toLocaleUpperCase('es-ES'),
      competicion: competicion.trim(),
      jornada: jornada.trim(),
      ladoEquipoA,
    })
  }

  return (
    <section className="card shadow-sm mt-4">
      <div className="card-body p-4">
        <h2 className="h4 mb-1">Configurar ojeo de partido</h2>
        <p className="text-body-secondary small mb-4">
          Elige hasta {MAXIMO_JUGADORES} jugadores a seguir y los datos del partido.
          Podrás corregir el lado más adelante si te equivocas.
        </p>

        {cargando && <p className="text-body-secondary">Cargando jugadores…</p>}

        {!cargando && (
          <>
            <div className="mb-4">
              <label className="form-label" htmlFor="buscar-jugador-partido">
                Jugadores a seguir ({seleccionados.length}/{MAXIMO_JUGADORES})
              </label>
              <PlayerSelect
                disabled={seleccionados.length >= MAXIMO_JUGADORES}
                id="buscar-jugador-partido"
                jugadores={opcionesDisponibles}
                posiciones={posiciones}
                textoVacio={
                  seleccionados.length >= MAXIMO_JUGADORES
                    ? 'Máximo alcanzado'
                    : 'Selecciona un jugador'
                }
                valor=""
                onCambiar={añadirJugadorPorId}
              />

              {seleccionados.length > 0 && (
                <div className="d-grid gap-2 mt-3">
                  {seleccionados.map((item) => (
                    <div
                      className="d-flex align-items-center justify-content-between gap-2 p-2 rounded border"
                      key={item.jugador.id}
                      style={{ borderColor: 'var(--app-border)' }}
                    >
                      <span className="fw-semibold">{item.jugador.nombre}</span>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => cambiarEquipoDeJugador(item.jugador.id)}
                        >
                          Equipo {item.equipo}
                        </button>
                        <button
                          aria-label={`Quitar a ${item.jugador.nombre}`}
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          onClick={() => quitarJugador(item.jugador.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="equipo-a-partido">
                  Equipo A
                </label>
                <input
                  className="form-control"
                  id="equipo-a-partido"
                  list={idListaEquipos}
                  placeholder="Nombre del equipo A"
                  type="text"
                  value={nombreEquipoA}
                  onChange={(evento) => setNombreEquipoA(evento.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="equipo-b-partido">
                  Equipo B
                </label>
                <input
                  className="form-control"
                  id="equipo-b-partido"
                  list={idListaEquipos}
                  placeholder="Nombre del equipo B"
                  type="text"
                  value={nombreEquipoB}
                  onChange={(evento) => setNombreEquipoB(evento.target.value)}
                />
              </div>
              <datalist id={idListaEquipos}>
                {nombresEquipos.map((nombre) => (
                  <option key={nombre} value={nombre} />
                ))}
              </datalist>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="competicion-partido">
                  Competición <span className="text-body-secondary">(opcional)</span>
                </label>
                <input
                  className="form-control"
                  id="competicion-partido"
                  placeholder="Ej. Liga, Copa, amistoso..."
                  type="text"
                  value={competicion}
                  onChange={(evento) => setCompeticion(evento.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="jornada-partido">
                  Jornada <span className="text-body-secondary">(opcional)</span>
                </label>
                <input
                  className="form-control"
                  id="jornada-partido"
                  placeholder="Ej. Jornada 12"
                  type="text"
                  value={jornada}
                  onChange={(evento) => setJornada(evento.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="form-label mb-2">¿Quién empieza a la izquierda?</p>
              <div className="btn-group" role="group">
                <button
                  className={`btn btn-sm ${
                    ladoEquipoA === 'izquierda' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  type="button"
                  onClick={() => setLadoEquipoA('izquierda')}
                >
                  Equipo A a la izquierda
                </button>
                <button
                  className={`btn btn-sm ${
                    ladoEquipoA === 'derecha' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  type="button"
                  onClick={() => setLadoEquipoA('derecha')}
                >
                  Equipo B a la izquierda
                </button>
              </div>
              <p className="small text-body-secondary mt-2 mb-0">
                Se puede corregir con el botón "Lados" durante el partido, y se cambia
                solo al pasar a la segunda parte.
              </p>
            </div>

            {error && (
              <p className="alert alert-danger py-2" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="button" onClick={empezarPartido}>
              Empezar partido
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default MatchSetupForm
