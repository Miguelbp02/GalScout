import {
  AREAS,
  AREAS_PORTERO,
  CENTRO_RADAR,
  RADIO_RADAR,
  coordenadasRadar,
  mediaArea,
} from '../constants/radarAreas'
import type { PerfilScouting, ResumenValoracionCriterio } from '../types/criterio'

interface PlayerComparisonRadarProps {
  perfilScouting: PerfilScouting
  nombreA: string
  nombreB: string
  valoracionesA: ResumenValoracionCriterio[]
  valoracionesB: ResumenValoracionCriterio[]
}

interface PuntoComparacion {
  etiqueta: string
  valor: number | null
  x: number
  y: number
}

function construirPuntos(
  areas: typeof AREAS,
  valoraciones: ResumenValoracionCriterio[],
): PuntoComparacion[] {
  const porNombre = new Map(
    valoraciones.map((valoracion) => [valoracion.nombre, valoracion]),
  )

  return areas.map((area, indice) => {
    const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / areas.length
    const valor = mediaArea(area, porNombre)
    const punto = coordenadasRadar(angulo, ((valor ?? 0) / 20) * RADIO_RADAR)

    return { etiqueta: area.etiqueta, valor, x: punto.x, y: punto.y }
  })
}

function PlayerComparisonRadar({
  perfilScouting,
  nombreA,
  nombreB,
  valoracionesA,
  valoracionesB,
}: PlayerComparisonRadarProps) {
  const areas = perfilScouting === 'portero' ? AREAS_PORTERO : AREAS
  const puntosA = construirPuntos(areas, valoracionesA)
  const puntosB = construirPuntos(areas, valoracionesB)

  const anillos = [0.25, 0.5, 0.75, 1]
  const ejes = areas.map((area, indice) => {
    const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / areas.length
    const extremo = coordenadasRadar(angulo, RADIO_RADAR)
    const posicionEtiqueta = coordenadasRadar(angulo, RADIO_RADAR + 17)

    return { etiqueta: area.etiqueta, extremo, posicionEtiqueta }
  })

  const hayDatosA = puntosA.some((punto) => punto.valor !== null)
  const hayDatosB = puntosB.some((punto) => punto.valor !== null)

  return (
    <section
      aria-labelledby="comparison-radar-title"
      className="player-comparison-radar"
    >
      <h3 className="visually-hidden" id="comparison-radar-title">
        Comparativa de perfiles
      </h3>
      <svg
        aria-hidden="true"
        className="player-profile-radar-chart"
        viewBox="0 0 200 200"
      >
        {anillos.map((anillo) => (
          <polygon
            className="player-profile-radar-ring"
            key={anillo}
            points={areas
              .map((_, indice) => {
                const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / areas.length
                const punto = coordenadasRadar(angulo, RADIO_RADAR * anillo)
                return `${punto.x},${punto.y}`
              })
              .join(' ')}
          />
        ))}

        {ejes.map((eje) => (
          <line
            className="player-profile-radar-axis"
            key={eje.etiqueta}
            x1={CENTRO_RADAR}
            x2={eje.extremo.x}
            y1={CENTRO_RADAR}
            y2={eje.extremo.y}
          />
        ))}

        {hayDatosB && (
          <polygon
            className="comparison-radar-profile comparison-radar-profile--b"
            points={puntosB.map((punto) => `${punto.x},${punto.y}`).join(' ')}
          />
        )}
        {hayDatosA && (
          <polygon
            className="comparison-radar-profile comparison-radar-profile--a"
            points={puntosA.map((punto) => `${punto.x},${punto.y}`).join(' ')}
          />
        )}

        {puntosB.map(
          (punto) =>
            punto.valor !== null && (
              <circle
                className="comparison-radar-point comparison-radar-point--b"
                cx={punto.x}
                cy={punto.y}
                key={`b-${punto.etiqueta}`}
                r="2.6"
              />
            ),
        )}
        {puntosA.map(
          (punto) =>
            punto.valor !== null && (
              <circle
                className="comparison-radar-point comparison-radar-point--a"
                cx={punto.x}
                cy={punto.y}
                key={`a-${punto.etiqueta}`}
                r="2.6"
              />
            ),
        )}

        {ejes.map((eje) => (
          <text
            className="player-profile-radar-label"
            key={eje.etiqueta}
            textAnchor="middle"
            x={eje.posicionEtiqueta.x}
            y={eje.posicionEtiqueta.y + 3}
          >
            {eje.etiqueta}
          </text>
        ))}
      </svg>

      <div className="comparison-radar-legend">
        <span className="comparison-legend-item comparison-legend-item--a">
          <i aria-hidden="true" />
          {nombreA}
        </span>
        <span className="comparison-legend-item comparison-legend-item--b">
          <i aria-hidden="true" />
          {nombreB}
        </span>
      </div>
    </section>
  )
}

export default PlayerComparisonRadar
