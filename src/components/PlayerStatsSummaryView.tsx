import { useMemo } from 'react'
import PlayerStatsSplitBar from './PlayerStatsSplitBar'
import { calcularConteos, calcularKpis, calcularPares } from '../services/playerStatsService'
import type { ResumenPar } from '../services/playerStatsService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'

interface PlayerStatsSummaryViewProps {
  acciones: AccionObservacionDePartido[]
  numeroPartidos: number
  perfilScouting: PerfilScouting
}

function formatearDecimal(valor: number, decimales = 1) {
  return valor.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

function formatearSigno(valor: number) {
  return valor > 0 ? `+${valor}` : `${valor}`
}

interface TarjetaKpiProps {
  valor: string
  etiqueta: string
  detalle?: string
  tono?: 'positivo' | 'negativo' | 'neutro'
}

function TarjetaKpi({ valor, etiqueta, detalle, tono = 'neutro' }: TarjetaKpiProps) {
  return (
    <div className="player-stats-kpi">
      <span className={`player-stats-kpi-valor player-stats-kpi-valor--${tono}`}>{valor}</span>
      <span className="player-stats-kpi-etiqueta">{etiqueta}</span>
      {detalle && <span className="player-stats-kpi-detalle">{detalle}</span>}
    </div>
  )
}

function BarraPar({ par }: { par: ResumenPar }) {
  const sinDatos = par.porcentajeExito === null

  return (
    <div className={`player-stats-barra ${sinDatos ? 'player-stats-barra--sin-datos' : ''}`}>
      <div className="player-stats-barra-cabecera">
        <span>{par.titulo}</span>
        <span className="player-stats-barra-valor">
          {sinDatos ? 'Sin datos' : `${Math.round(par.porcentajeExito ?? 0)} %`}
          <span className="player-stats-barra-intentos">
            {' '}
            ({par.aciertos}/{par.intentos})
          </span>
        </span>
      </div>
      <div
        aria-label={`${par.titulo}: ${
          sinDatos ? 'sin datos' : `${Math.round(par.porcentajeExito ?? 0)} por ciento`
        }`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={sinDatos ? undefined : Math.round(par.porcentajeExito ?? 0)}
        className="player-stats-barra-pista"
        role="progressbar"
      >
        <div
          className="player-stats-barra-relleno"
          style={{ width: `${par.porcentajeExito ?? 0}%` }}
        />
      </div>
      <p className="player-stats-barra-ayuda">{par.detalleAyuda}</p>
    </div>
  )
}

function PlayerStatsSummaryView({
  acciones,
  numeroPartidos,
  perfilScouting,
}: PlayerStatsSummaryViewProps) {
  const kpis = useMemo(() => calcularKpis(acciones, numeroPartidos), [acciones, numeroPartidos])
  const pares = useMemo(() => calcularPares(acciones, perfilScouting), [acciones, perfilScouting])
  const conteos = useMemo(() => calcularConteos(acciones), [acciones])

  // Con un solo partido una «media por partido» es el propio dato disfrazado
  // de estadística: se muestra el absoluto y se cambia la etiqueta.
  const partidoUnico = numeroPartidos === 1

  const paresVisibles = pares.filter((par) => par.nucleo || par.intentos > 0)

  const conteosPositivos = conteos.filter((conteo) => conteo.categoria === 'positiva')
  const conteosNegativos = conteos.filter((conteo) => conteo.categoria === 'negativa')
  const maximoPositivo = Math.max(1, ...conteosPositivos.map((conteo) => conteo.total))
  const maximoNegativo = Math.max(1, ...conteosNegativos.map((conteo) => conteo.total))

  function renderRanking(
    lista: typeof conteos,
    maximo: number,
    categoria: 'positiva' | 'negativa',
    titulo: string,
  ) {
    if (lista.length === 0) return null

    return (
      <div className="player-stats-repertorio-grupo">
        <h4 className="player-stats-bloque-titulo">{titulo}</h4>
        {lista.map((conteo) => (
          <div className="player-stats-repertorio-fila" key={conteo.etiquetaNombre}>
            <span className="player-stats-repertorio-nombre">{conteo.etiquetaNombre}</span>
            <span className="player-stats-repertorio-total">
              {conteo.total}
              {!partidoUnico && numeroPartidos > 0 && (
                <span className="player-stats-repertorio-media">
                  {' '}
                  · {formatearDecimal(conteo.total / numeroPartidos)}/partido
                </span>
              )}
            </span>
            <span className="player-stats-repertorio-pista">
              <span
                className={`player-stats-repertorio-relleno player-stats-repertorio-relleno--${categoria}`}
                style={{ width: `${(conteo.total / maximo) * 100}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="player-stats-vista">
      <section className="player-stats-bloque" aria-labelledby="stats-impacto-titulo">
        <div className="player-stats-bloque-cabecera">
          <h3 className="player-stats-bloque-titulo" id="stats-impacto-titulo">
            Impacto
          </h3>
        </div>

        <div className="player-stats-kpis">
          <TarjetaKpi
            detalle={partidoUnico ? undefined : `${kpis.totalAcciones} en total`}
            etiqueta={partidoUnico ? 'Acciones en el partido' : 'Acciones por partido'}
            valor={
              partidoUnico
                ? `${kpis.totalAcciones}`
                : kpis.accionesPorPartido === null
                  ? '—'
                  : formatearDecimal(kpis.accionesPorPartido)
            }
          />
          <TarjetaKpi
            detalle="positivas menos negativas"
            etiqueta={partidoUnico ? 'Saldo del partido' : 'Saldo total'}
            tono={kpis.balance > 0 ? 'positivo' : kpis.balance < 0 ? 'negativo' : 'neutro'}
            valor={formatearSigno(kpis.balance)}
          />
          <TarjetaKpi
            detalle={`${kpis.positivas} de ${kpis.totalAcciones}`}
            etiqueta="Acciones positivas"
            valor={
              kpis.porcentajePositivas === null
                ? '—'
                : `${Math.round(kpis.porcentajePositivas)} %`
            }
          />
          <TarjetaKpi
            detalle={
              kpis.partidosConAcciones === numeroPartidos
                ? 'todos aportan datos'
                : `${numeroPartidos - kpis.partidosConAcciones} sin ninguna acción`
            }
            etiqueta="Partidos con registro"
            valor={`${kpis.partidosConAcciones} de ${numeroPartidos}`}
          />
        </div>

        <PlayerStatsSplitBar
          etiquetaAccesible={`Balance: ${kpis.positivas} acciones positivas y ${kpis.negativas} negativas`}
          segmentos={[
            { clave: 'positivas', etiqueta: 'Positivas', valor: kpis.positivas, tono: 'positiva' },
            { clave: 'negativas', etiqueta: 'Negativas', valor: kpis.negativas, tono: 'negativa' },
          ]}
          textoVacio="Sin acciones en los partidos elegidos."
        />
      </section>

      {paresVisibles.length > 0 && (
        <section className="player-stats-bloque" aria-labelledby="stats-ratios-titulo">
          <div className="player-stats-bloque-cabecera">
            <h3 className="player-stats-bloque-titulo" id="stats-ratios-titulo">
              Ratios de acierto
            </h3>
            <p className="player-stats-bloque-ayuda">
              El número entre paréntesis es la muestra: un 100 % de 1 intento no es una virtud.
            </p>
          </div>

          <div className="player-stats-resumen">
            {paresVisibles.map((par) => (
              <BarraPar key={par.clave} par={par} />
            ))}
          </div>
        </section>
      )}

      {conteos.length > 0 && (
        <section className="player-stats-bloque" aria-labelledby="stats-repertorio-titulo">
          <div className="player-stats-bloque-cabecera">
            <h3 className="player-stats-bloque-titulo" id="stats-repertorio-titulo">
              Repertorio
            </h3>
            <p className="player-stats-bloque-ayuda">
              Qué hace de verdad este jugador, ordenado por frecuencia.
            </p>
          </div>

          <div className="player-stats-repertorio">
            {renderRanking(conteosPositivos, maximoPositivo, 'positiva', 'Positivas')}
            {renderRanking(conteosNegativos, maximoNegativo, 'negativa', 'Negativas')}
          </div>
        </section>
      )}
    </div>
  )
}

export default PlayerStatsSummaryView
