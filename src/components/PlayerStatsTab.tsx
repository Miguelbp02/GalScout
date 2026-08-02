import { useMemo, useState } from 'react'
import PlayerStatsMatchesView from './PlayerStatsMatchesView'
import PlayerStatsSummaryView from './PlayerStatsSummaryView'
import PlayerStatsTimeView from './PlayerStatsTimeView'
import PlayerStatsZonesView from './PlayerStatsZonesView'
import { useEstadisticasJugador } from '../hooks/useEstadisticasJugador'
import {
  TEXTO_MUESTRA,
  calcularPorPartido,
  evaluarMuestra,
  filtrarAccionesDeJuego,
} from '../services/playerStatsService'
import type { PerfilScouting } from '../types/criterio'
import type { ObservacionJugador } from '../types/observacion'

type ModoFiltro = 'todos' | 'ultimos3' | 'ultimo' | 'elegir'
type VistaEstadisticas = 'resumen' | 'zonas' | 'tiempo' | 'partidos'

interface PlayerStatsTabProps {
  observaciones: ObservacionJugador[]
  perfilScouting: PerfilScouting
}

const VISTAS: { clave: VistaEstadisticas; etiqueta: string }[] = [
  { clave: 'resumen', etiqueta: 'Resumen' },
  { clave: 'zonas', etiqueta: 'Zonas' },
  { clave: 'tiempo', etiqueta: 'Tiempo' },
  { clave: 'partidos', etiqueta: 'Partidos' },
]

function formatearFecha(fecha: string) {
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  const [anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}

function PlayerStatsTab({ observaciones, perfilScouting }: PlayerStatsTabProps) {
  const {
    accionesTodas,
    cargandoAcciones: cargando,
    errorAcciones: error,
    partidos,
  } = useEstadisticasJugador(observaciones)

  const [modo, setModo] = useState<ModoFiltro>('todos')
  const [vista, setVista] = useState<VistaEstadisticas>('resumen')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  // Se cargan de golpe las acciones de TODOS los partidos y el filtrado se hace
  // en memoria. Son unas pocas decenas de filas por jugador, y a cambio cambiar
  // de filtro es instantáneo y se puede saber cuántas acciones tiene cada
  // partido antes de elegirlo.
  const idsActivos = useMemo(() => {
    if (modo === 'ultimo') return partidos.slice(0, 1).map((partido) => partido.id)
    if (modo === 'ultimos3') return partidos.slice(0, 3).map((partido) => partido.id)
    if (modo === 'todos') return partidos.map((partido) => partido.id)
    return partidos
      .filter((partido) => seleccionados.has(partido.id))
      .map((partido) => partido.id)
  }, [modo, partidos, seleccionados])

  const claveActivos = idsActivos.join('|')

  const acciones = useMemo(() => {
    const activos = new Set(claveActivos === '' ? [] : claveActivos.split('|'))
    return accionesTodas.filter((accion) => activos.has(accion.observacionId))
  }, [accionesTodas, claveActivos])

  const partidosActivos = useMemo(() => {
    const activos = new Set(claveActivos === '' ? [] : claveActivos.split('|'))
    return partidos.filter((partido) => activos.has(partido.id))
  }, [partidos, claveActivos])

  const conteoPorPartido = useMemo(() => calcularPorPartido(accionesTodas), [accionesTodas])
  const accionesDeJuego = useMemo(() => filtrarAccionesDeJuego(acciones), [acciones])
  const nivelMuestra = evaluarMuestra(idsActivos.length, accionesDeJuego.length)

  function alternarPartido(id: string) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  function verSoloPartido(id: string) {
    setSeleccionados(new Set([id]))
    setModo('elegir')
  }

  if (partidos.length === 0) {
    return (
      <section className="player-detail-empty-tab" role="tabpanel">
        <h2 className="h5">Estadísticas</h2>
        <p className="mb-0 text-body-secondary">
          Todavía no hay informes de partido guardados para este jugador. En cuanto se guarde el
          primero desde el modo de ojeo en directo, aparecerán aquí sus estadísticas.
        </p>
      </section>
    )
  }

  const modosDisponibles: { clave: ModoFiltro; etiqueta: string }[] = [
    { clave: 'todos', etiqueta: `Todos (${partidos.length})` },
    ...(partidos.length > 3
      ? [{ clave: 'ultimos3' as ModoFiltro, etiqueta: 'Últimos 3' }]
      : []),
    { clave: 'ultimo', etiqueta: 'Último partido' },
    { clave: 'elegir', etiqueta: 'Elegir partidos' },
  ]

  const todosSeleccionados =
    partidos.length > 0 && partidos.every((partido) => seleccionados.has(partido.id))

  return (
    <section className="player-stats-tab" role="tabpanel">
      <div className="player-stats-filtro">
        <div className="btn-group" role="group" aria-label="Qué partidos incluir">
          {modosDisponibles.map((opcion) => (
            <button
              className={`btn btn-sm ${
                modo === opcion.clave ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              key={opcion.clave}
              type="button"
              onClick={() => setModo(opcion.clave)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        {modo === 'elegir' && (
          <div className="player-stats-lista-partidos">
            <div className="player-stats-lista-cabecera">
              <span className="player-stats-bloque-titulo">
                {seleccionados.size} de {partidos.length} elegidos
              </span>
              <button
                aria-label={
                  todosSeleccionados ? 'Quitar todos los partidos' : 'Elegir todos los partidos'
                }
                aria-pressed={todosSeleccionados}
                className="stats-etiquetas-toggle stats-etiquetas-toggle--positiva"
                title={todosSeleccionados ? 'Quitar todos' : 'Elegir todos'}
                type="button"
                onClick={() =>
                  setSeleccionados(
                    todosSeleccionados
                      ? new Set()
                      : new Set(partidos.map((partido) => partido.id)),
                  )
                }
              >
                <span aria-hidden="true" className="stats-etiquetas-toggle-track">
                  <span className="stats-etiquetas-toggle-thumb" />
                </span>
              </button>
            </div>

            <div className="player-stats-partidos-chips">
              {partidos.map((partido) => {
                const total = conteoPorPartido.get(partido.id)?.total ?? 0
                const elegido = seleccionados.has(partido.id)

                return (
                  <button
                    aria-pressed={elegido}
                    className={`player-stats-partido-chip ${elegido ? 'active' : ''} ${
                      total === 0 ? 'player-stats-partido-chip--vacio' : ''
                    }`}
                    key={partido.id}
                    type="button"
                    onClick={() => alternarPartido(partido.id)}
                  >
                    <span className="player-stats-partido-chip-fecha">
                      {formatearFecha(partido.fechaObservacion)}
                    </span>
                    {partido.equipoRival && (
                      <span className="player-stats-partido-chip-rival">
                        vs {partido.equipoRival}
                      </span>
                    )}
                    <span className="player-stats-partido-chip-total">
                      {total === 0 ? 'sin acciones' : `${total} acc.`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="player-stats-muestra">
          <span className="player-stats-muestra-dato">
            <strong>{idsActivos.length}</strong>{' '}
            {idsActivos.length === 1 ? 'partido' : 'partidos'}
          </span>
          <span className="player-stats-muestra-dato">
            <strong>{accionesDeJuego.length}</strong>{' '}
            {accionesDeJuego.length === 1 ? 'acción' : 'acciones'}
          </span>
          <span
            className={`player-stats-muestra-nivel player-stats-muestra-nivel--${nivelMuestra}`}
          >
            {TEXTO_MUESTRA[nivelMuestra]}
          </span>
        </p>
      </div>

      <nav
        aria-label="Vistas de estadísticas"
        className="player-stats-vistas"
        role="tablist"
      >
        {VISTAS.map((opcion) => (
          <button
            aria-selected={vista === opcion.clave}
            className={`player-stats-vista-tab ${vista === opcion.clave ? 'active' : ''}`}
            key={opcion.clave}
            role="tab"
            type="button"
            onClick={() => setVista(opcion.clave)}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </nav>

      {error && (
        <p className="alert alert-danger py-2" role="alert">
          {error}
        </p>
      )}

      {cargando && <p className="text-body-secondary">Cargando acciones…</p>}

      {!cargando && !error && idsActivos.length === 0 && (
        <p className="player-stats-bloque-vacio">
          Elige al menos un partido para ver sus estadísticas.
        </p>
      )}

      {!cargando && !error && idsActivos.length > 0 && (
        <>
          {vista === 'resumen' && (
            <PlayerStatsSummaryView
              acciones={acciones}
              numeroPartidos={idsActivos.length}
              perfilScouting={perfilScouting}
            />
          )}
          {vista === 'zonas' && (
            <PlayerStatsZonesView acciones={acciones} perfilScouting={perfilScouting} />
          )}
          {vista === 'tiempo' && <PlayerStatsTimeView acciones={acciones} />}
          {vista === 'partidos' &&
            (partidosActivos.length > 1 ? (
              <PlayerStatsMatchesView
                acciones={acciones}
                partidos={partidosActivos}
                onElegirPartido={verSoloPartido}
              />
            ) : (
              <p className="player-stats-bloque-vacio">
                La comparación entre partidos necesita al menos dos. Amplía la selección para ver
                si el jugador es regular.
              </p>
            ))}
        </>
      )}
    </section>
  )
}

export default PlayerStatsTab
