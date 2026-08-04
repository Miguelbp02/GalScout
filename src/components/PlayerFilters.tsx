import { useEffect, useState, type CSSProperties } from 'react'
import { obtenerPosiciones } from '../services/positionService'
import {
  filtrosJugadoresIniciales,
  limitesFiltrosJugadores,
  type FiltrosJugadores,
  type OrdenJugadores,
} from '../types/filtrosJugador'
import type { Posicion } from '../types/posicion'
import FilterIcon from './FilterIcon'

interface PlayerFiltersProps {
  filtros: FiltrosJugadores
  onCambiarFiltros: (filtros: FiltrosJugadores) => void
  integradoEnMenu?: boolean
  modo?: 'completo' | 'accion' | 'panel'
  varianteBoton?: 'texto' | 'icono'
  abierto?: boolean
  onCambiarAbierto?: (abierto: boolean) => void
  className?: string
}

function PlayerFilters({
  filtros,
  onCambiarFiltros,
  integradoEnMenu = false,
  modo = 'completo',
  varianteBoton = 'texto',
  abierto: abiertoControlado,
  onCambiarAbierto,
  className = '',
}: PlayerFiltersProps) {
  const [abiertoInterno, setAbiertoInterno] = useState(false)
  const [posiciones, setPosiciones] = useState<Posicion[]>([])
  const [errorPosiciones, setErrorPosiciones] = useState(false)

  const abierto = abiertoControlado ?? abiertoInterno

  function cambiarAbierto(siguienteEstado: boolean) {
    if (onCambiarAbierto) {
      onCambiarAbierto(siguienteEstado)
      return
    }

    setAbiertoInterno(siguienteEstado)
  }

  useEffect(() => {
    async function cargarPosiciones() {
      try {
        setPosiciones(await obtenerPosiciones())
      } catch {
        setErrorPosiciones(true)
      }
    }

    void cargarPosiciones()
  }, [])

  const totalFiltrosActivos = [
    Boolean(filtros.nombre),
    filtros.edadMinima !== limitesFiltrosJugadores.edadMinima ||
      filtros.edadMaxima !== limitesFiltrosJugadores.edadMaxima,
    filtros.alturaMinima !== limitesFiltrosJugadores.alturaMinima ||
      filtros.alturaMaxima !== limitesFiltrosJugadores.alturaMaxima,
    Boolean(filtros.piernaDominante),
    Boolean(filtros.estado),
    Boolean(filtros.posicionNatural),
    filtros.soloFicticios,
  ].filter(Boolean).length

  function cambiarFiltro(campo: keyof FiltrosJugadores, valor: string) {
    onCambiarFiltros({ ...filtros, [campo]: valor })
  }

  function cambiarEdadMinima(valor: number) {
    onCambiarFiltros({
      ...filtros,
      edadMinima: Math.min(valor, filtros.edadMaxima),
    })
  }

  function cambiarEdadMaxima(valor: number) {
    onCambiarFiltros({
      ...filtros,
      edadMaxima: Math.max(valor, filtros.edadMinima),
    })
  }

  function cambiarAlturaMinima(valor: number) {
    onCambiarFiltros({
      ...filtros,
      alturaMinima: Math.min(valor, filtros.alturaMaxima),
    })
  }

  function cambiarAlturaMaxima(valor: number) {
    onCambiarFiltros({
      ...filtros,
      alturaMaxima: Math.max(valor, filtros.alturaMinima),
    })
  }

  function cambiarOrden(orden: OrdenJugadores) {
    onCambiarFiltros({ ...filtros, orden })
  }

  function cambiarSoloFicticios(soloFicticios: boolean) {
    onCambiarFiltros({ ...filtros, soloFicticios })
  }

  function estiloRango(minimo: number, maximo: number, valorMinimo: number, valorMaximo: number) {
    const amplitud = maximo - minimo

    return {
      '--rango-inicio': `${((valorMinimo - minimo) / amplitud) * 100}%`,
      '--rango-fin': `${((valorMaximo - minimo) / amplitud) * 100}%`,
    } as CSSProperties
  }

  return (
    <section
      className={`player-filters ${
        integradoEnMenu ? 'player-filters--integrated' : modo === 'completo' ? 'mt-4' : ''
      } ${className}`}
      aria-label="Filtros de jugadores"
    >
      {modo !== 'panel' && (
        <div className="player-filters-actions d-flex align-items-center gap-2">
        {varianteBoton === 'icono' ? (
          <button
            aria-expanded={abierto}
            aria-label="Filtrar jugadores"
            className="player-filters-icon-trigger"
            title="Filtrar jugadores"
            type="button"
            onClick={() => cambiarAbierto(!abierto)}
          >
            <FilterIcon size={16} />
            {totalFiltrosActivos > 0 && (
              <span className="filter-count ms-1">{totalFiltrosActivos}</span>
            )}
          </button>
        ) : (
          <button
            aria-expanded={abierto}
            className={integradoEnMenu ? 'app-nav-link app-nav-filter' : 'btn btn-outline-secondary'}
            type="button"
            onClick={() => cambiarAbierto(!abierto)}
          >
            Filtrar jugadores
            {totalFiltrosActivos > 0 && (
              <span className="filter-count ms-2">{totalFiltrosActivos}</span>
            )}
          </button>
        )}

        {totalFiltrosActivos > 0 && (
          <button
            className="btn btn-link btn-sm text-body-secondary"
            type="button"
            onClick={() => onCambiarFiltros(filtrosJugadoresIniciales)}
          >
            Limpiar filtros
          </button>
        )}
        </div>
      )}

      {modo !== 'accion' && abierto && (
        <div className={`filters-panel ${integradoEnMenu ? 'filters-panel--integrated' : 'mt-3'}`}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="filtro-nombre">
                Buscar por nombre
              </label>
              <input
                className="form-control"
                id="filtro-nombre"
                placeholder="Escribe un nombre o apellido"
                type="search"
                value={filtros.nombre}
                onChange={(evento) => cambiarFiltro('nombre', evento.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                <label className="form-label mb-0" htmlFor="filtro-edad-minima">
                  Edad
                </label>
                <span className="filter-range-value">
                  {filtros.edadMinima}–{filtros.edadMaxima} años
                </span>
              </div>
              <div
                className="double-range"
                style={estiloRango(
                  limitesFiltrosJugadores.edadMinima,
                  limitesFiltrosJugadores.edadMaxima,
                  filtros.edadMinima,
                  filtros.edadMaxima,
                )}
              >
                <input
                  id="filtro-edad-minima"
                  max={limitesFiltrosJugadores.edadMaxima}
                  min={limitesFiltrosJugadores.edadMinima}
                  type="range"
                  value={filtros.edadMinima}
                  onChange={(evento) => cambiarEdadMinima(Number(evento.target.value))}
                />
                <input
                  aria-label="Edad máxima"
                  max={limitesFiltrosJugadores.edadMaxima}
                  min={limitesFiltrosJugadores.edadMinima}
                  type="range"
                  value={filtros.edadMaxima}
                  onChange={(evento) => cambiarEdadMaxima(Number(evento.target.value))}
                />
              </div>
              <div className="filter-sort-controls" aria-label="Ordenar por edad">
                <span>Ordenar:</span>
                <button
                  aria-pressed={filtros.orden === 'edad-asc'}
                  type="button"
                  onClick={() => cambiarOrden('edad-asc')}
                >
                  Asc.
                </button>
                <button
                  aria-pressed={filtros.orden === 'edad-desc'}
                  type="button"
                  onClick={() => cambiarOrden('edad-desc')}
                >
                  Desc.
                </button>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                <label className="form-label mb-0" htmlFor="filtro-altura-minima">
                  Altura
                </label>
                <span className="filter-range-value">
                  {filtros.alturaMinima}–{filtros.alturaMaxima} cm
                </span>
              </div>
              <div
                className="double-range"
                style={estiloRango(
                  limitesFiltrosJugadores.alturaMinima,
                  limitesFiltrosJugadores.alturaMaxima,
                  filtros.alturaMinima,
                  filtros.alturaMaxima,
                )}
              >
                <input
                  id="filtro-altura-minima"
                  max={limitesFiltrosJugadores.alturaMaxima}
                  min={limitesFiltrosJugadores.alturaMinima}
                  type="range"
                  value={filtros.alturaMinima}
                  onChange={(evento) => cambiarAlturaMinima(Number(evento.target.value))}
                />
                <input
                  aria-label="Altura máxima"
                  max={limitesFiltrosJugadores.alturaMaxima}
                  min={limitesFiltrosJugadores.alturaMinima}
                  type="range"
                  value={filtros.alturaMaxima}
                  onChange={(evento) => cambiarAlturaMaxima(Number(evento.target.value))}
                />
              </div>
              <div className="filter-sort-controls" aria-label="Ordenar por altura">
                <span>Ordenar:</span>
                <button
                  aria-pressed={filtros.orden === 'altura-asc'}
                  type="button"
                  onClick={() => cambiarOrden('altura-asc')}
                >
                  Asc.
                </button>
                <button
                  aria-pressed={filtros.orden === 'altura-desc'}
                  type="button"
                  onClick={() => cambiarOrden('altura-desc')}
                >
                  Desc.
                </button>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="filtro-pierna">
                Pierna dominante
              </label>
              <select
                className="form-select"
                id="filtro-pierna"
                value={filtros.piernaDominante}
                onChange={(evento) => cambiarFiltro('piernaDominante', evento.target.value)}
              >
                <option value="">Cualquier pierna</option>
                <option value="Derecha">Derecha</option>
                <option value="Izquierda">Izquierda</option>
                <option value="Ambas">Ambas</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="filtro-estado">
                Estado
              </label>
              <select
                className="form-select"
                id="filtro-estado"
                value={filtros.estado}
                onChange={(evento) => cambiarFiltro('estado', evento.target.value)}
              >
                <option value="">Cualquier estado</option>
                <option value="En equipo">En equipo</option>
                <option value="Libre">Libre</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="filtro-posicion">
                Posición natural
              </label>
              <select
                className="form-select"
                disabled={errorPosiciones}
                id="filtro-posicion"
                value={filtros.posicionNatural}
                onChange={(evento) => cambiarFiltro('posicionNatural', evento.target.value)}
              >
                <option value="">Cualquier posición</option>
                {posiciones.map((posicion) => (
                  <option key={posicion.id} value={posicion.nombre}>
                    {posicion.nombre}
                  </option>
                ))}
              </select>
              {errorPosiciones && (
                <p className="small text-danger mt-1 mb-0">
                  No se han podido cargar las posiciones.
                </p>
              )}
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  checked={filtros.soloFicticios}
                  className="form-check-input"
                  id="filtro-solo-ficticios"
                  type="checkbox"
                  onChange={(evento) => cambiarSoloFicticios(evento.target.checked)}
                />
                <label className="form-check-label" htmlFor="filtro-solo-ficticios">
                  Ver solo jugadores ficticios{' '}
                  <span className="text-body-secondary">(de prueba, ocultos por defecto)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PlayerFilters
