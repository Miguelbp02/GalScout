import { useEffect, useMemo, useState } from 'react'
import PlayerActionsPitchMap from './PlayerActionsPitchMap'
import { obtenerAccionesDeObservaciones } from '../services/observationService'
import { calcularResumenAcciones } from '../services/playerStatsService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'
import type { ObservacionJugador } from '../types/observacion'

type ModoFiltro = 'ultimo' | 'todos' | 'elegir'

interface PlayerStatsTabProps {
  observaciones: ObservacionJugador[]
  perfilScouting: PerfilScouting
}

interface ResumenBarraProps {
  etiqueta: string
  porcentaje: number | null
  detalle?: string
}

function ResumenBarra({ etiqueta, porcentaje, detalle }: ResumenBarraProps) {
  return (
    <div className="player-stats-barra">
      <div className="player-stats-barra-cabecera">
        <span>{etiqueta}</span>
        <span className="player-stats-barra-valor">
          {porcentaje === null ? 'Sin datos' : `${Math.round(porcentaje)}%`}
          {detalle ? ` (${detalle})` : ''}
        </span>
      </div>
      <div className="player-stats-barra-pista">
        <div className="player-stats-barra-relleno" style={{ width: `${porcentaje ?? 0}%` }} />
      </div>
    </div>
  )
}

function formatearFecha(fecha: string) {
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  const [anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}

function PlayerStatsTab({ observaciones, perfilScouting }: PlayerStatsTabProps) {
  const partidos = useMemo(
    () =>
      observaciones
        .filter((observacion) => observacion.tipo === 'partido')
        .sort((a, b) => b.fechaObservacion.localeCompare(a.fechaObservacion)),
    [observaciones],
  )

  const [modo, setModo] = useState<ModoFiltro>('todos')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [acciones, setAcciones] = useState<AccionObservacionDePartido[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idsActivos = useMemo(() => {
    if (modo === 'ultimo') return partidos.length > 0 ? [partidos[0].id] : []
    if (modo === 'todos') return partidos.map((partido) => partido.id)
    return partidos.filter((partido) => seleccionados.has(partido.id)).map((partido) => partido.id)
  }, [modo, partidos, seleccionados])

  useEffect(() => {
    if (idsActivos.length === 0) return

    let cancelado = false

    async function cargarAcciones() {
      setCargando(true)
      setError(null)

      try {
        const datos = await obtenerAccionesDeObservaciones(idsActivos)
        if (!cancelado) setAcciones(datos)
      } catch {
        if (!cancelado) {
          setError('No se han podido cargar las acciones de los partidos elegidos.')
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    void cargarAcciones()

    return () => {
      cancelado = true
    }
  }, [idsActivos])

  const resumen = useMemo(
    () => calcularResumenAcciones(acciones, idsActivos.length),
    [acciones, idsActivos.length],
  )

  function alternarPartido(id: string) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) {
        nuevo.delete(id)
      } else {
        nuevo.add(id)
      }
      return nuevo
    })
  }

  if (partidos.length === 0) {
    return (
      <section className="player-detail-empty-tab" role="tabpanel">
        <h2 className="h5">Estadísticas</h2>
        <p className="mb-0 text-body-secondary">
          Todavía no hay informes de partido guardados para este jugador. En cuanto se
          guarde el primero desde el modo de ojeo en directo, aparecerán aquí sus
          estadísticas.
        </p>
      </section>
    )
  }

  return (
    <section className="player-stats-tab" role="tabpanel">
      <div className="player-stats-filtro">
        <div className="btn-group" role="group" aria-label="Qué partidos incluir">
          <button
            className={`btn btn-sm ${modo === 'todos' ? 'btn-primary' : 'btn-outline-secondary'}`}
            type="button"
            onClick={() => setModo('todos')}
          >
            Todos ({partidos.length})
          </button>
          <button
            className={`btn btn-sm ${modo === 'ultimo' ? 'btn-primary' : 'btn-outline-secondary'}`}
            type="button"
            onClick={() => setModo('ultimo')}
          >
            Último partido
          </button>
          <button
            className={`btn btn-sm ${modo === 'elegir' ? 'btn-primary' : 'btn-outline-secondary'}`}
            type="button"
            onClick={() => setModo('elegir')}
          >
            Elegir partidos
          </button>
        </div>

        {modo === 'elegir' && (
          <div className="player-stats-lista-partidos">
            {partidos.map((partido) => (
              <label className="player-stats-partido-check" key={partido.id}>
                <input
                  checked={seleccionados.has(partido.id)}
                  type="checkbox"
                  onChange={() => alternarPartido(partido.id)}
                />
                <span>
                  {formatearFecha(partido.fechaObservacion)}
                  {partido.equipoRival ? ` · vs ${partido.equipoRival}` : ''}
                  {partido.competicion ? ` · ${partido.competicion}` : ''}
                  {partido.jornada ? ` (${partido.jornada})` : ''}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="alert alert-danger py-2" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && idsActivos.length === 0 && (
        <p className="text-body-secondary">
          Elige al menos un partido para ver sus estadísticas.
        </p>
      )}

      {!cargando && !error && idsActivos.length > 0 && (
        <>
          <div className="player-stats-resumen">
            <ResumenBarra
              detalle={`${resumen.regates.positivos}/${
                resumen.regates.positivos + resumen.regates.negativos
              }`}
              etiqueta="% de regates exitosos"
              porcentaje={resumen.regates.porcentajeExito}
            />
            <ResumenBarra
              detalle={`${resumen.duelos.positivos}/${
                resumen.duelos.positivos + resumen.duelos.negativos
              }`}
              etiqueta="% de duelos ganados"
              porcentaje={resumen.duelos.porcentajeExito}
            />
            <ResumenBarra
              etiqueta="Efectividad en ocasiones"
              porcentaje={resumen.efectividadOcasiones}
            />
            <div className="player-stats-metric-simple">
              <span className="player-stats-metric-simple-valor">
                {resumen.perdidasPromedioPorPartido.toFixed(1)}
              </span>
              <span className="player-stats-metric-simple-etiqueta">
                Pérdidas de media por partido
              </span>
            </div>
          </div>

          {resumen.conteos.length > 0 && (
            <div className="player-stats-conteos">
              {resumen.conteos.map((conteo) => (
                <span
                  className={`player-stats-conteo player-stats-conteo--${conteo.categoria}`}
                  key={conteo.etiquetaNombre}
                >
                  {conteo.etiquetaNombre}: {conteo.total}
                </span>
              ))}
            </div>
          )}

          <PlayerActionsPitchMap acciones={acciones} perfilScouting={perfilScouting} />
        </>
      )}
    </section>
  )
}

export default PlayerStatsTab
