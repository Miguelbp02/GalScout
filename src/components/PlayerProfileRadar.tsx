import { useEffect, useState } from 'react'
import {
  AREAS,
  AREAS_PORTERO,
  CENTRO_RADAR,
  RADIO_RADAR,
  coordenadasRadar,
  mediaArea,
} from '../constants/radarAreas'
import { obtenerValoracionesMediasJugador } from '../services/playerRatingsService'
import type {
  PerfilScouting,
  ResumenValoracionCriterio,
} from '../types/criterio'

interface PlayerProfileRadarProps {
  jugadorId: string
  versionActualizacion: number
  perfilScouting: PerfilScouting
}

interface PuntoRadar {
  etiqueta: string
  valor: number | null
  x: number
  y: number
  extremoX: number
  extremoY: number
  etiquetaX: number
  etiquetaY: number
}

function PlayerProfileRadar({
  jugadorId,
  versionActualizacion,
  perfilScouting,
}: PlayerProfileRadarProps) {
  const [valoraciones, setValoraciones] = useState<ResumenValoracionCriterio[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true)

      try {
        setValoraciones(
          await obtenerValoracionesMediasJugador(jugadorId, perfilScouting),
        )
      } catch {
        setValoraciones([])
      } finally {
        setCargando(false)
      }
    }

    void cargarPerfil()
  }, [jugadorId, perfilScouting, versionActualizacion])

  const areas = perfilScouting === 'portero' ? AREAS_PORTERO : AREAS

  const valoracionesPorNombre = new Map(
    valoraciones.map((valoracion) => [valoracion.nombre, valoracion]),
  )
  const puntos: PuntoRadar[] = areas.map((area, indice) => {
    const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / areas.length
    const extremo = coordenadasRadar(angulo, RADIO_RADAR)
    const etiqueta = coordenadasRadar(angulo, RADIO_RADAR + 17)
    const valor = mediaArea(area, valoracionesPorNombre)
    const punto = coordenadasRadar(angulo, ((valor ?? 0) / 20) * RADIO_RADAR)

    return {
      etiqueta: area.etiqueta,
      valor,
      x: punto.x,
      y: punto.y,
      extremoX: extremo.x,
      extremoY: extremo.y,
      etiquetaX: etiqueta.x,
      etiquetaY: etiqueta.y,
    }
  })

  const perfilCompleto = puntos.every((punto) => punto.valor !== null)
  const puntosPerfil = puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')
  const anillos = [0.25, 0.5, 0.75, 1]

  return (
    <section className="player-profile-radar" aria-labelledby="perfil-radar-title">
      <h2 id="perfil-radar-title" className="visually-hidden">
        Perfil de valoraciones
      </h2>
      <svg
        aria-label={
          perfilCompleto
            ? 'Perfil medio de valoraciones del jugador'
            : 'Perfil de valoraciones incompleto'
        }
        className="player-profile-radar-chart"
        role="img"
        viewBox="0 0 200 200"
      >
        {anillos.map((anillo) => (
          <polygon
            className="player-profile-radar-ring"
            key={anillo}
            points={areas.map((_, indice) => {
              const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / areas.length
              const punto = coordenadasRadar(angulo, RADIO_RADAR * anillo)
              return `${punto.x},${punto.y}`
            }).join(' ')}
          />
        ))}

        {puntos.map((punto) => (
          <line
            className="player-profile-radar-axis"
            key={punto.etiqueta}
            x1={CENTRO_RADAR}
            x2={punto.extremoX}
            y1={CENTRO_RADAR}
            y2={punto.extremoY}
          />
        ))}

        {perfilCompleto && (
          <polygon className="player-profile-radar-profile" points={puntosPerfil} />
        )}

        {puntos.map((punto) => (
          <g key={punto.etiqueta}>
            {punto.valor !== null && (
              <circle
                className="player-profile-radar-point"
                cx={punto.x}
                cy={punto.y}
                r="3"
              />
            )}
            <text
              className="player-profile-radar-label"
              textAnchor="middle"
              x={punto.etiquetaX}
              y={punto.etiquetaY + 3}
            >
              {punto.etiqueta}
            </text>
          </g>
        ))}
      </svg>

      <p className="player-profile-radar-caption mb-0">
        {cargando
          ? 'Cargando perfil…'
          : valoraciones.length === 0
            ? 'Sin valoraciones todavía'
            : perfilCompleto
              ? 'Perfil medio'
              : 'Perfil parcial'}
      </p>
    </section>
  )
}

export default PlayerProfileRadar
