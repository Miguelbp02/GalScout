import { useMemo } from 'react'
import { calcularTiempo } from '../services/playerStatsService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'

interface PlayerStatsTimeViewProps {
  acciones: AccionObservacionDePartido[]
}

// Geometría del gráfico de tramos. Se fija aquí arriba porque los seis tramos,
// el eje y la línea del descanso tienen que cuadrar exactamente: con seis
// columnas de 95 px el minuto 45 cae justo en el borde entre la tercera y la
// cuarta, que es donde de verdad está el descanso.
const ANCHO_SVG = 620
const ALTO_SVG = 172
const MARGEN_IZQUIERDO = 36
const MARGEN_DERECHO = 14
const ANCHO_UTIL = ANCHO_SVG - MARGEN_IZQUIERDO - MARGEN_DERECHO
const NUMERO_TRAMOS = 6
const ANCHO_TRAMO = ANCHO_UTIL / NUMERO_TRAMOS
const ANCHO_BARRA = 44
const LINEA_CERO = 92
const ALTO_MAXIMO = 48
const MINIMO_ACCIONES_TIMELINE = 6

function PlayerStatsTimeView({ acciones }: PlayerStatsTimeViewProps) {
  const tiempo = useMemo(() => calcularTiempo(acciones), [acciones])

  const totalAcciones = tiempo.partes.reduce((suma, parte) => suma + parte.total, 0)
  const [primera, segunda] = tiempo.partes
  const puedeCompararPartes = primera.total > 0 && segunda.total > 0
  const variacion = puedeCompararPartes
    ? ((segunda.total - primera.total) / primera.total) * 100
    : null

  const mostrarTimeline =
    tiempo.hayMinutosRegistrados && totalAcciones >= MINIMO_ACCIONES_TIMELINE

  if (totalAcciones === 0) {
    return (
      <div className="player-stats-vista">
        <p className="player-stats-bloque-vacio">
          No hay acciones registradas en los partidos elegidos, así que todavía no se puede leer
          cuándo aparece el jugador.
        </p>
      </div>
    )
  }

  function alturaBarra(valor: number) {
    if (valor === 0) return 0
    if (tiempo.maximoTramo === 0) return 0
    // Mínimo visible: un solo registro tiene que verse, no desaparecer.
    return Math.max(2, (valor / tiempo.maximoTramo) * ALTO_MAXIMO)
  }

  return (
    <div className="player-stats-vista">
      <section className="player-stats-bloque" aria-labelledby="stats-partes-titulo">
        <div className="player-stats-bloque-cabecera">
          <h3 className="player-stats-bloque-titulo" id="stats-partes-titulo">
            Primera parte frente a segunda
          </h3>
          <p className="player-stats-bloque-ayuda">
            La parte se guarda con cada acción, así que este dato aguanta aunque el cronómetro se
            haya ajustado a mano.
          </p>
        </div>

        <div className="player-stats-partes">
          {tiempo.partes.map((parte) => (
            <div className="player-stats-parte" key={parte.parte}>
              <span className="player-stats-parte-titulo">{parte.parte}ª parte</span>
              {parte.total === 0 ? (
                <span className="player-stats-parte-vacia">Sin acciones registradas</span>
              ) : (
                <>
                  <span className="player-stats-parte-valor">{parte.total}</span>
                  <span className="player-stats-parte-detalle">
                    {parte.positivas} positivas · {parte.negativas} negativas
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {variacion !== null && (
          <p
            className={`player-stats-parte-delta ${
              variacion < 0 ? 'player-stats-parte-delta--baja' : 'player-stats-parte-delta--sube'
            }`}
          >
            {variacion < 0
              ? `Baja un ${Math.abs(Math.round(variacion))} % de volumen en la segunda parte.`
              : variacion > 0
                ? `Sube un ${Math.round(variacion)} % de volumen en la segunda parte.`
                : 'Mantiene el mismo volumen en las dos partes.'}
          </p>
        )}
      </section>

      <section className="player-stats-bloque" aria-labelledby="stats-tramos-titulo">
        <div className="player-stats-bloque-cabecera">
          <h3 className="player-stats-bloque-titulo" id="stats-tramos-titulo">
            Reparto por tramos
          </h3>
          {tiempo.primerMinuto !== null && tiempo.ultimoMinuto !== null && (
            <p className="player-stats-bloque-ayuda">
              Acciones entre el minuto {tiempo.primerMinuto} y el {tiempo.ultimoMinuto}.
            </p>
          )}
        </div>

        {!mostrarTimeline ? (
          <p className="player-stats-bloque-vacio">
            {tiempo.hayMinutosRegistrados
              ? 'Hacen falta unas cuantas acciones más para que el reparto por tramos diga algo.'
              : 'Las acciones se anotaron sin el cronómetro en marcha, así que no hay minutos que repartir.'}
          </p>
        ) : (
          <>
            <div className="player-stats-timeline">
              <svg
                aria-hidden="true"
                className="player-stats-timeline-svg"
                viewBox={`0 0 ${ANCHO_SVG} ${ALTO_SVG}`}
              >
                {tiempo.tramos.map((tramo, indice) => {
                  const centro = MARGEN_IZQUIERDO + ANCHO_TRAMO * indice + ANCHO_TRAMO / 2
                  const altoPositivas = alturaBarra(tramo.positivas)
                  const altoNegativas = alturaBarra(tramo.negativas)

                  return (
                    <g key={tramo.desde}>
                      {tramo.positivas > 0 && (
                        <rect
                          className="player-stats-timeline-barra player-stats-timeline-barra--positiva"
                          height={altoPositivas}
                          rx="2"
                          width={ANCHO_BARRA}
                          x={centro - ANCHO_BARRA / 2}
                          y={LINEA_CERO - altoPositivas}
                        />
                      )}
                      {tramo.negativas > 0 && (
                        <rect
                          className="player-stats-timeline-barra player-stats-timeline-barra--negativa"
                          height={altoNegativas}
                          rx="2"
                          width={ANCHO_BARRA}
                          x={centro - ANCHO_BARRA / 2}
                          y={LINEA_CERO}
                        />
                      )}
                      {tramo.total > 0 && (
                        <text
                          className="player-stats-timeline-valor"
                          textAnchor="middle"
                          x={centro}
                          y={LINEA_CERO - altoPositivas - 6}
                        >
                          {tramo.total}
                        </text>
                      )}
                    </g>
                  )
                })}

                <line
                  className="player-stats-timeline-eje"
                  x1={MARGEN_IZQUIERDO}
                  x2={ANCHO_SVG - MARGEN_DERECHO}
                  y1={LINEA_CERO}
                  y2={LINEA_CERO}
                />

                <line
                  className="player-stats-timeline-descanso"
                  x1={MARGEN_IZQUIERDO + ANCHO_TRAMO * 3}
                  x2={MARGEN_IZQUIERDO + ANCHO_TRAMO * 3}
                  y1={LINEA_CERO - ALTO_MAXIMO - 14}
                  y2={LINEA_CERO + ALTO_MAXIMO + 14}
                />

                {Array.from({ length: NUMERO_TRAMOS + 1 }, (_, indice) => (
                  <text
                    className="player-stats-timeline-etiqueta"
                    key={indice}
                    textAnchor="middle"
                    x={MARGEN_IZQUIERDO + ANCHO_TRAMO * indice}
                    y={LINEA_CERO + ALTO_MAXIMO + 30}
                  >
                    {indice * 15}&apos;
                  </text>
                ))}
              </svg>
            </div>

            <ul className="visually-hidden">
              {tiempo.tramos.map((tramo) => (
                <li key={tramo.desde}>
                  Minuto {tramo.desde} a {tramo.hasta}: {tramo.positivas}{' '}
                  {tramo.positivas === 1 ? 'acción positiva' : 'acciones positivas'} y{' '}
                  {tramo.negativas} {tramo.negativas === 1 ? 'negativa' : 'negativas'}.
                </li>
              ))}
            </ul>

            <ul className="player-stats-timeline-leyenda">
              <li>
                <i
                  aria-hidden="true"
                  className="player-stats-split-punto player-stats-split-punto--positiva"
                />
                Positivas, hacia arriba
              </li>
              <li>
                <i
                  aria-hidden="true"
                  className="player-stats-split-punto player-stats-split-punto--negativa"
                />
                Negativas, hacia abajo
              </li>
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

export default PlayerStatsTimeView
