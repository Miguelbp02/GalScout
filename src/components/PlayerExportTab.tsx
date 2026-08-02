import { useEffect, useMemo, useRef, useState } from 'react'
import { useEstadisticasJugador } from '../hooks/useEstadisticasJugador'
import { filtrarAccionesDeJuego } from '../services/playerStatsService'
import type { PerfilScouting } from '../types/criterio'
import type { ConfiguracionInformeJugador, ConfiguracionMapaInforme } from '../types/exportacionJugador'
import type { Jugador } from '../types/jugador'
import type { ObservacionJugador } from '../types/observacion'
import type { Posicion } from '../types/posicion'
import type { ValoracionGeneral } from '../types/valoracionGeneral'

interface PlayerExportTabProps {
  jugador: Jugador
  observaciones: ObservacionJugador[]
  perfilScouting: PerfilScouting
  posiciones: Posicion[]
  posicionesAptasIds: number[]
  posicionesNaturalesIds: number[]
  valoracionesGenerales: ValoracionGeneral[]
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha
}

function crearIdMapa() {
  return `mapa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nombreArchivo(nombre: string) {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `informe-${limpio || 'jugador'}.pdf`
}

function PlayerExportTab({
  jugador,
  observaciones,
  perfilScouting,
  posiciones,
  posicionesAptasIds,
  posicionesNaturalesIds,
  valoracionesGenerales,
}: PlayerExportTabProps) {
  const { accionesTodas, cargandoAcciones, errorAcciones, partidos } =
    useEstadisticasJugador(observaciones)
  const [idsPartidos, setIdsPartidos] = useState<Set<string>>(new Set())
  const [incluirRatios, setIncluirRatios] = useState(true)
  const [incluirRepertorio, setIncluirRepertorio] = useState(true)
  const [mapas, setMapas] = useState<ConfiguracionMapaInforme[]>([])
  const [idsObservaciones, setIdsObservaciones] = useState<Set<string>>(new Set())
  const [idsValoraciones, setIdsValoraciones] = useState<Set<string>>(
    new Set(valoracionesGenerales.map((valoracion) => valoracion.id)),
  )
  const [generando, setGenerando] = useState(false)
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const partidosInicializados = useRef(false)
  const mapasInicializados = useRef(false)
  const valoracionesInicializadas = useRef(valoracionesGenerales.length > 0)

  useEffect(() => {
    if (partidosInicializados.current || partidos.length === 0) return
    setIdsPartidos(new Set(partidos.map((partido) => partido.id)))
    partidosInicializados.current = true
  }, [partidos])

  useEffect(() => {
    if (valoracionesInicializadas.current || valoracionesGenerales.length === 0) return
    setIdsValoraciones(new Set(valoracionesGenerales.map((valoracion) => valoracion.id)))
    valoracionesInicializadas.current = true
  }, [valoracionesGenerales])

  const accionesSeleccionadas = useMemo(() => {
    return filtrarAccionesDeJuego(accionesTodas).filter((accion) =>
      idsPartidos.has(accion.observacionId),
    )
  }, [accionesTodas, idsPartidos])

  const etiquetasDisponibles = useMemo(() => {
    const porNombre = new Map<
      string,
      { nombre: string; categoria: 'positiva' | 'negativa'; total: number }
    >()

    accionesSeleccionadas.forEach((accion) => {
      if (accion.categoria === 'neutra') return
      const existente = porNombre.get(accion.etiquetaNombre)
      if (existente) existente.total += 1
      else {
        porNombre.set(accion.etiquetaNombre, {
          nombre: accion.etiquetaNombre,
          categoria: accion.categoria,
          total: 1,
        })
      }
    })

    return [...porNombre.values()].sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria === 'positiva' ? -1 : 1
      return b.total - a.total
    })
  }, [accionesSeleccionadas])

  useEffect(() => {
    if (mapasInicializados.current || etiquetasDisponibles.length === 0) return
    setMapas([
      {
        id: crearIdMapa(),
        titulo: 'Mapa general de acciones',
        modo: 'zonas',
        etiquetas: etiquetasDisponibles.map((etiqueta) => etiqueta.nombre),
      },
    ])
    mapasInicializados.current = true
  }, [etiquetasDisponibles])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function alternarEnSet(
    actualizar: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) {
    actualizar((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }

  function seleccionarPartidos(ids: string[]) {
    setIdsPartidos(new Set(ids))
  }

  function actualizarMapa(id: string, cambios: Partial<ConfiguracionMapaInforme>) {
    setMapas((actuales) =>
      actuales.map((mapa) => (mapa.id === id ? { ...mapa, ...cambios } : mapa)),
    )
  }

  function alternarEtiquetaMapa(mapa: ConfiguracionMapaInforme, nombre: string) {
    const siguiente = mapa.etiquetas.includes(nombre)
      ? mapa.etiquetas.filter((etiqueta) => etiqueta !== nombre)
      : [...mapa.etiquetas, nombre]
    actualizarMapa(mapa.id, { etiquetas: siguiente })
  }

  function moverMapa(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion
    if (destino < 0 || destino >= mapas.length) return
    setMapas((actuales) => {
      const siguientes = [...actuales]
      const [mapa] = siguientes.splice(indice, 1)
      siguientes.splice(destino, 0, mapa)
      return siguientes
    })
  }

  function añadirMapa() {
    setMapas((actuales) => [
      ...actuales,
      {
        id: crearIdMapa(),
        titulo: `Mapa de acciones ${actuales.length + 1}`,
        modo: 'zonas',
        etiquetas: etiquetasDisponibles.map((etiqueta) => etiqueta.nombre),
      },
    ])
  }

  async function previsualizar() {
    const mapaSinEtiquetas = mapas.some((mapa) => mapa.etiquetas.length === 0)
    if (mapaSinEtiquetas) {
      setErrorGeneracion('Cada mapa debe incluir al menos una acción.')
      return
    }

    setGenerando(true)
    setErrorGeneracion(null)

    const configuracion: ConfiguracionInformeJugador = {
      idsPartidos: [...idsPartidos],
      incluirRatios,
      incluirRepertorio,
      mapas,
      idsObservaciones: [...idsObservaciones],
      idsValoracionesGenerales: [...idsValoraciones],
    }

    try {
      const { generarInformeJugadorPdf } = await import('../pdf/generarInformeJugador')
      const blob = await generarInformeJugadorPdf({
        jugador,
        posiciones,
        posicionesNaturalesIds,
        posicionesAptasIds,
        perfilScouting,
        acciones: accionesTodas,
        observaciones,
        valoracionesGenerales,
        configuracion,
      })
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (error) {
      console.error(error)
      setErrorGeneracion('No se ha podido generar la previsualización del informe.')
    } finally {
      setGenerando(false)
    }
  }

  if (previewUrl) {
    return (
      <section className="player-export-preview" role="tabpanel">
        <div className="player-export-preview-header">
          <div>
            <h2 className="h5 mb-1">Previsualización del informe</h2>
            <p className="small text-body-secondary mb-0">
              Este es exactamente el archivo que se descargará.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary" type="button" onClick={() => setPreviewUrl(null)}>
              Volver a configurar
            </button>
            <a className="btn btn-outline-secondary" href={previewUrl} rel="noreferrer" target="_blank">
              Abrir aparte
            </a>
            <a className="btn btn-primary" download={nombreArchivo(jugador.nombre)} href={previewUrl}>
              Descargar PDF
            </a>
          </div>
        </div>
        <iframe className="player-export-preview-frame" src={previewUrl} title={`Previsualización del informe de ${jugador.nombre}`} />
      </section>
    )
  }

  const positivas = etiquetasDisponibles.filter((etiqueta) => etiqueta.categoria === 'positiva')
  const negativas = etiquetasDisponibles.filter((etiqueta) => etiqueta.categoria === 'negativa')

  return (
    <section className="player-export-tab" role="tabpanel">
      <div className="player-export-intro">
        <div>
          <h2 className="h5 mb-1">Configurar informe PDF</h2>
          <p className="small text-body-secondary mb-0">
            La cabecera con los datos y posiciones del jugador se incluye siempre.
          </p>
        </div>
        <span className="player-export-fixed-badge">Cabecera obligatoria</span>
      </div>

      <section className="player-export-section">
        <div className="player-export-section-header">
          <div>
            <h3 className="h6 mb-1">1. Partidos para las estadísticas</h3>
            <p className="small text-body-secondary mb-0">
              La selección se aplicará a ratios, repertorio y todos los mapas.
            </p>
          </div>
          <span className="small text-body-secondary">{idsPartidos.size} seleccionados</span>
        </div>

        {cargandoAcciones && <p className="small text-body-secondary">Cargando acciones…</p>}
        {errorAcciones && <p className="alert alert-danger py-2">{errorAcciones}</p>}
        {partidos.length === 0 ? (
          <p className="player-stats-bloque-vacio mb-0">No hay informes de partido con los que generar estadísticas.</p>
        ) : (
          <>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => seleccionarPartidos(partidos.map((partido) => partido.id))}>
                Todos
              </button>
              {partidos.length > 3 && (
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => seleccionarPartidos(partidos.slice(0, 3).map((partido) => partido.id))}>
                  Últimos 3
                </button>
              )}
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => seleccionarPartidos(partidos.slice(0, 1).map((partido) => partido.id))}>
                Último partido
              </button>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => seleccionarPartidos([])}>
                Ninguno
              </button>
            </div>
            <div className="player-export-check-grid">
              {partidos.map((partido) => (
                <label className="player-export-check-card" key={partido.id}>
                  <input checked={idsPartidos.has(partido.id)} type="checkbox" onChange={() => alternarEnSet(setIdsPartidos, partido.id)} />
                  <span>
                    <strong>{formatearFecha(partido.fechaObservacion)}</strong>
                    <small>{partido.equipoRival ? `vs ${partido.equipoRival}` : 'Partido sin rival indicado'}</small>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="player-export-section">
        <div className="player-export-section-header">
          <div>
            <h3 className="h6 mb-1">2. Bloques estadísticos</h3>
            <p className="small text-body-secondary mb-0">Activa los resúmenes que quieres incorporar.</p>
          </div>
        </div>
        <div className="player-export-module-grid">
          <label className="player-export-module-card">
            <input checked={incluirRatios} type="checkbox" onChange={(evento) => setIncluirRatios(evento.target.checked)} />
            <span><strong>Ratios de acierto</strong><small>Regates, duelos, ocasiones o intervenciones de portero.</small></span>
          </label>
          <label className="player-export-module-card">
            <input checked={incluirRepertorio} type="checkbox" onChange={(evento) => setIncluirRepertorio(evento.target.checked)} />
            <span><strong>Repertorio</strong><small>Frecuencia de todas las acciones positivas y negativas.</small></span>
          </label>
        </div>
      </section>

      <section className="player-export-section">
        <div className="player-export-section-header">
          <div>
            <h3 className="h6 mb-1">3. Mapas de acciones</h3>
            <p className="small text-body-secondary mb-0">Cada mapa puede tener su propio título, modo y conjunto de acciones.</p>
          </div>
          <button className="btn btn-sm btn-outline-primary" disabled={etiquetasDisponibles.length === 0} type="button" onClick={añadirMapa}>
            Añadir mapa
          </button>
        </div>

        {mapas.length === 0 && <p className="player-stats-bloque-vacio mb-0">No se incluirán mapas en el informe.</p>}
        <div className="d-grid gap-3">
          {mapas.map((mapa, indice) => (
            <article className="player-export-map-card" key={mapa.id}>
              <div className="player-export-map-header">
                <input aria-label="Título del mapa" className="form-control form-control-sm" value={mapa.titulo} onChange={(evento) => actualizarMapa(mapa.id, { titulo: evento.target.value })} />
                <div className="btn-group btn-group-sm">
                  <button aria-label="Subir mapa" className="btn btn-outline-secondary" disabled={indice === 0} type="button" onClick={() => moverMapa(indice, -1)}>↑</button>
                  <button aria-label="Bajar mapa" className="btn btn-outline-secondary" disabled={indice === mapas.length - 1} type="button" onClick={() => moverMapa(indice, 1)}>↓</button>
                  <button className="btn btn-outline-danger" type="button" onClick={() => setMapas((actuales) => actuales.filter((actual) => actual.id !== mapa.id))}>Quitar</button>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {(['zonas', 'puntos'] as const).map((modo) => (
                  <button className={`btn btn-sm ${mapa.modo === modo ? 'btn-primary' : 'btn-outline-secondary'}`} key={modo} type="button" onClick={() => actualizarMapa(mapa.id, { modo })}>
                    {modo === 'zonas' ? 'Zonas' : 'Puntos'}
                  </button>
                ))}
                <button className="btn btn-sm btn-outline-secondary ms-auto" type="button" onClick={() => actualizarMapa(mapa.id, { etiquetas: etiquetasDisponibles.map((etiqueta) => etiqueta.nombre) })}>Todas</button>
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => actualizarMapa(mapa.id, { etiquetas: [] })}>Ninguna</button>
              </div>
              <div className="player-export-tag-groups">
                {[['Acciones positivas', positivas], ['Acciones negativas', negativas]].map(([titulo, etiquetas]) => (
                  <div key={titulo as string}>
                    <h4 className="small fw-semibold mb-2">{titulo as string}</h4>
                    <div className="player-export-tags">
                      {(etiquetas as typeof etiquetasDisponibles).map((etiqueta) => (
                        <button
                          aria-pressed={mapa.etiquetas.includes(etiqueta.nombre)}
                          className={`player-export-tag player-export-tag--${etiqueta.categoria} ${mapa.etiquetas.includes(etiqueta.nombre) ? 'active' : ''}`}
                          key={etiqueta.nombre}
                          type="button"
                          onClick={() => alternarEtiquetaMapa(mapa, etiqueta.nombre)}
                        >
                          {etiqueta.nombre} <span>{etiqueta.total}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="player-export-section">
        <div className="player-export-section-header">
          <div>
            <h3 className="h6 mb-1">4. Observaciones</h3>
            <p className="small text-body-secondary mb-0">Elige los informes históricos que quieres adjuntar completos.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setIdsObservaciones(new Set(observaciones.map((observacion) => observacion.id)))}>Todas</button>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setIdsObservaciones(new Set())}>Ninguna</button>
          </div>
        </div>
        <div className="player-export-record-list">
          {observaciones.length === 0 && <p className="player-stats-bloque-vacio mb-0">No hay observaciones disponibles.</p>}
          {observaciones.map((observacion) => (
            <label className="player-export-record" key={observacion.id}>
              <input checked={idsObservaciones.has(observacion.id)} type="checkbox" onChange={() => alternarEnSet(setIdsObservaciones, observacion.id)} />
              <span className="player-export-record-main">
                <strong>{formatearFecha(observacion.fechaObservacion)}</strong>
                <small>{observacion.tipo ?? 'observación'}{observacion.equipoRival ? ` · vs ${observacion.equipoRival}` : ''}</small>
              </span>
              <span className="player-export-record-preview">{observacion.notas || 'Sin notas'}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="player-export-section">
        <div className="player-export-section-header">
          <div>
            <h3 className="h6 mb-1">5. Valoraciones generales</h3>
            <p className="small text-body-secondary mb-0">Estas valoraciones están pensadas como conclusión del informe.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setIdsValoraciones(new Set(valoracionesGenerales.map((valoracion) => valoracion.id)))}>Todas</button>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setIdsValoraciones(new Set())}>Ninguna</button>
          </div>
        </div>
        <div className="player-export-record-list">
          {valoracionesGenerales.length === 0 && <p className="player-stats-bloque-vacio mb-0">No hay valoraciones generales disponibles.</p>}
          {valoracionesGenerales.map((valoracion) => (
            <label className="player-export-record" key={valoracion.id}>
              <input checked={idsValoraciones.has(valoracion.id)} type="checkbox" onChange={() => alternarEnSet(setIdsValoraciones, valoracion.id)} />
              <span className="player-export-record-main">
                <strong>{formatearFecha(valoracion.fechaValoracion)}</strong>
                <small>{valoracion.autorNombre}</small>
              </span>
              <span className="general-rating-score">{valoracion.puntuacion} / 20</span>
              <span className="player-export-record-preview">{valoracion.comentario || 'Sin comentario'}</span>
            </label>
          ))}
        </div>
      </section>

      {errorGeneracion && <p className="alert alert-danger" role="alert">{errorGeneracion}</p>}

      <div className="player-export-actions">
        <div className="small text-body-secondary">
          {mapas.length} {mapas.length === 1 ? 'mapa' : 'mapas'} · {idsObservaciones.size} observaciones · {idsValoraciones.size} valoraciones
        </div>
        <button className="btn btn-primary btn-lg" disabled={generando} type="button" onClick={() => void previsualizar()}>
          {generando ? 'Generando previsualización…' : 'Previsualizar informe'}
        </button>
      </div>
    </section>
  )
}

export default PlayerExportTab
