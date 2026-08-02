import type { EtiquetaVisible } from '../hooks/useFiltroEtiquetas'

interface PlayerActionsTagFiltersProps {
  positivas: EtiquetaVisible[]
  negativas: EtiquetaVisible[]
  ocultas: Set<string>
  grupoActivo: (lista: EtiquetaVisible[]) => boolean
  onAlternarEtiqueta: (nombre: string) => void
  onAlternarGrupo: (lista: EtiquetaVisible[], mostrar: boolean) => void
}

function PlayerActionsTagFilters({
  positivas,
  negativas,
  ocultas,
  grupoActivo,
  onAlternarEtiqueta,
  onAlternarGrupo,
}: PlayerActionsTagFiltersProps) {
  function renderGrupo(
    lista: EtiquetaVisible[],
    categoria: 'positiva' | 'negativa',
    titulo: string,
  ) {
    if (lista.length === 0) return null

    const activo = grupoActivo(lista)

    return (
      <div className="stats-etiquetas-grupo">
        <div className="stats-etiquetas-grupo-cabecera">
          <span className="stats-etiquetas-grupo-titulo">{titulo}</span>
          <button
            aria-label={`${activo ? 'Ocultar' : 'Mostrar'} todas las ${titulo.toLowerCase()}`}
            aria-pressed={activo}
            className={`stats-etiquetas-toggle stats-etiquetas-toggle--${categoria}`}
            title={activo ? 'Ocultar todas' : 'Mostrar todas'}
            type="button"
            onClick={() => onAlternarGrupo(lista, !activo)}
          >
            <span aria-hidden="true" className="stats-etiquetas-toggle-track">
              <span className="stats-etiquetas-toggle-thumb" />
            </span>
          </button>
        </div>

        <div className="stats-etiquetas-chips">
          {lista.map((etiqueta) => {
            const vacia = etiqueta.total === 0
            const visible = !ocultas.has(etiqueta.nombre)

            return (
              <button
                aria-pressed={visible && !vacia}
                className={`stats-etiquetas-chip stats-etiquetas-chip--${categoria} ${
                  visible && !vacia ? 'active' : ''
                } ${vacia ? 'stats-etiquetas-chip--vacia' : ''} ${
                  etiqueta.obsoleta ? 'stats-etiquetas-chip--obsoleta' : ''
                }`}
                disabled={vacia}
                key={etiqueta.nombre}
                title={
                  etiqueta.obsoleta
                    ? `${etiqueta.nombre} — etiqueta retirada del catálogo, presente en informes antiguos`
                    : vacia
                      ? `${etiqueta.nombre} — sin registros en los partidos elegidos`
                      : etiqueta.nombre
                }
                type="button"
                onClick={() => onAlternarEtiqueta(etiqueta.nombre)}
              >
                <span className="stats-etiquetas-chip-nombre">{etiqueta.nombre}</span>
                <span className="stats-etiquetas-chip-total">{etiqueta.total}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="stats-etiquetas-filtro">
      {renderGrupo(positivas, 'positiva', 'Acciones positivas')}
      {renderGrupo(negativas, 'negativa', 'Acciones negativas')}
    </div>
  )
}

export default PlayerActionsTagFilters
