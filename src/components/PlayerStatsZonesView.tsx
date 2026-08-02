import { useMemo, useState } from 'react'
import PlayerActionsPitchMap from './PlayerActionsPitchMap'
import PlayerActionsTagFilters from './PlayerActionsTagFilters'
import PlayerStatsSplitBar from './PlayerStatsSplitBar'
import { useFiltroEtiquetas } from '../hooks/useFiltroEtiquetas'
import { calcularZonas } from '../services/playerStatsService'
import type { ModoMapa } from './PlayerActionsPitchMap'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'

interface PlayerStatsZonesViewProps {
  acciones: AccionObservacionDePartido[]
  perfilScouting: PerfilScouting
}

const MODOS: { clave: ModoMapa; etiqueta: string }[] = [
  { clave: 'puntos', etiqueta: 'Puntos' },
  { clave: 'zonas', etiqueta: 'Zonas' },
]

// Rampa de intensidad con un único color base: evita inventar colores nuevos
// y deja claro que es una escala ordenada, no categorías distintas.
const INTENSIDADES = [0.45, 0.7, 1]

function PlayerStatsZonesView({ acciones, perfilScouting }: PlayerStatsZonesViewProps) {
  const [modo, setModo] = useState<ModoMapa>('puntos')
  const filtro = useFiltroEtiquetas(perfilScouting, acciones)
  const zonas = useMemo(() => calcularZonas(filtro.accionesVisibles), [filtro.accionesVisibles])

  const hayAcciones = filtro.accionesVisibles.length > 0

  return (
    <div className="player-stats-vista">
      <section className="player-stats-bloque" aria-labelledby="stats-mapa-titulo">
        <div className="player-stats-bloque-cabecera">
          <h3 className="player-stats-bloque-titulo" id="stats-mapa-titulo">
            Dónde juega
          </h3>
          <div className="stats-pitch-map-modos" role="group" aria-label="Modo del mapa">
            {MODOS.map((opcion) => (
              <button
                aria-pressed={modo === opcion.clave}
                className={`stats-pitch-map-modo ${modo === opcion.clave ? 'active' : ''}`}
                key={opcion.clave}
                type="button"
                onClick={() => setModo(opcion.clave)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <p className="player-stats-bloque-ayuda">
          Todas las acciones se giran para leerse atacando hacia arriba, así que la banda
          izquierda es siempre la izquierda del jugador.
        </p>

        <div className="stats-pitch-map">
          <PlayerActionsTagFilters
            grupoActivo={filtro.grupoActivo}
            negativas={filtro.negativas}
            ocultas={filtro.ocultas}
            positivas={filtro.positivas}
            onAlternarEtiqueta={filtro.alternarEtiqueta}
            onAlternarGrupo={filtro.alternarGrupo}
          />

          <PlayerActionsPitchMap
            acciones={filtro.accionesVisibles}
            modo={modo}
            zonas={zonas}
          />
        </div>
      </section>

      {hayAcciones && (
        <section className="player-stats-bloque" aria-labelledby="stats-reparto-titulo">
          <div className="player-stats-bloque-cabecera">
            <h3 className="player-stats-bloque-titulo" id="stats-reparto-titulo">
              Reparto por el campo
            </h3>
            {zonas.porcentajeCampoContrario !== null && (
              <p className="player-stats-bloque-ayuda">
                {Math.round(zonas.porcentajeCampoContrario)} % de sus acciones caen en campo
                contrario.
              </p>
            )}
          </div>

          <div className="player-stats-reparto">
            <div className="player-stats-reparto-grupo">
              <h4 className="player-stats-bloque-titulo">Por altura</h4>
              <PlayerStatsSplitBar
                etiquetaAccesible="Reparto de acciones por tercio del campo"
                segmentos={[
                  {
                    clave: 'defensivo',
                    etiqueta: 'Tercio defensivo',
                    valor: zonas.porTercio.defensivo,
                    tono: 'accion',
                    intensidad: INTENSIDADES[0],
                  },
                  {
                    clave: 'medio',
                    etiqueta: 'Tercio medio',
                    valor: zonas.porTercio.medio,
                    tono: 'accion',
                    intensidad: INTENSIDADES[1],
                  },
                  {
                    clave: 'ofensivo',
                    etiqueta: 'Tercio ofensivo',
                    valor: zonas.porTercio.ofensivo,
                    tono: 'accion',
                    intensidad: INTENSIDADES[2],
                  },
                ]}
                textoVacio="Sin acciones que repartir."
              />
            </div>

            <div className="player-stats-reparto-grupo">
              <h4 className="player-stats-bloque-titulo">Por carril</h4>
              <PlayerStatsSplitBar
                etiquetaAccesible="Reparto de acciones por carril del campo"
                segmentos={[
                  {
                    clave: 'izquierdo',
                    etiqueta: 'Banda izquierda',
                    valor: zonas.porCarril.izquierdo,
                    tono: 'acento',
                    intensidad: INTENSIDADES[0],
                  },
                  {
                    clave: 'central',
                    etiqueta: 'Carril central',
                    valor: zonas.porCarril.central,
                    tono: 'acento',
                    intensidad: INTENSIDADES[1],
                  },
                  {
                    clave: 'derecho',
                    etiqueta: 'Banda derecha',
                    valor: zonas.porCarril.derecho,
                    tono: 'acento',
                    intensidad: INTENSIDADES[2],
                  },
                ]}
                textoVacio="Sin acciones que repartir."
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default PlayerStatsZonesView
