export type TonoSegmento = 'positiva' | 'negativa' | 'accion' | 'acento'

export interface SegmentoBarra {
  clave: string
  etiqueta: string
  valor: number
  tono: TonoSegmento
  /** 0-1. Permite una rampa de intensidad con un solo color base. */
  intensidad?: number
}

interface PlayerStatsSplitBarProps {
  segmentos: SegmentoBarra[]
  /** Texto que se muestra cuando todos los segmentos suman cero. */
  textoVacio: string
  etiquetaAccesible: string
}

/**
 * Barra apilada al 100 % con su leyenda. Los anchos se calculan con la fracción
 * cruda, sin redondear, para que sumen exactamente el ancho disponible y no
 * quede una rendija al final.
 */
function PlayerStatsSplitBar({
  segmentos,
  textoVacio,
  etiquetaAccesible,
}: PlayerStatsSplitBarProps) {
  const total = segmentos.reduce((suma, segmento) => suma + segmento.valor, 0)

  if (total === 0) {
    return <p className="player-stats-split-vacio">{textoVacio}</p>
  }

  return (
    <div className="player-stats-split">
      <div aria-label={etiquetaAccesible} className="player-stats-split-pista" role="img">
        {segmentos
          .filter((segmento) => segmento.valor > 0)
          .map((segmento) => (
            <span
              className={`player-stats-split-segmento player-stats-split-segmento--${segmento.tono}`}
              key={segmento.clave}
              style={{
                width: `${(segmento.valor / total) * 100}%`,
                opacity: segmento.intensidad,
              }}
            />
          ))}
      </div>

      <ul className="player-stats-split-leyenda">
        {segmentos.map((segmento) => (
          <li className="player-stats-split-leyenda-item" key={segmento.clave}>
            <i
              aria-hidden="true"
              className={`player-stats-split-punto player-stats-split-punto--${segmento.tono}`}
              style={{ opacity: segmento.intensidad }}
            />
            <span className="player-stats-split-leyenda-texto">{segmento.etiqueta}</span>
            <span className="player-stats-split-leyenda-valor">
              {segmento.valor}
              <span className="player-stats-split-leyenda-porcentaje">
                {' '}
                ({Math.round((segmento.valor / total) * 100)} %)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerStatsSplitBar
