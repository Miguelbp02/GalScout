import { useEffect, useState } from 'react'
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

interface AreaRadar {
  etiqueta: string
  criterios: string[]
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

const AREAS: AreaRadar[] = [
  {
    etiqueta: 'Físico',
    criterios: [
      'Aceleración',
      'Velocidad punta',
      'Agilidad',
      'Resistencia',
      'Fuerza en duelos',
      'Potencia de salto',
      'Equilibrio',
    ],
  },
  {
    etiqueta: 'Técnica',
    criterios: [
      'Control orientado',
      'Conducción',
      'Regate 1v1 ofensivo',
      'Uso de pierna no dominante',
    ],
  },
  {
    etiqueta: 'Pase',
    criterios: [
      'Pase corto',
      'Pase largo',
      'Centros',
      'Visión de juego',
      'Dirección de juego con balón',
    ],
  },
  {
    etiqueta: 'Ataque',
    criterios: [
      'Golpeo potente',
      'Golpeo preciso',
      'Definición',
      'Juego de cabeza',
      'Desmarque',
    ],
  },
  {
    etiqueta: 'Defensa',
    criterios: [
      'Posicionamiento defensivo',
      'Anticipación e interceptación',
      'Defensa 1v1',
      'Trabajo de presión',
      'Compromiso defensivo',
    ],
  },
  {
    etiqueta: 'Mental',
    criterios: [
      'Toma de decisiones',
      'Transiciones',
      'Comprensión del rol',
      'Concentración',
      'Competitividad',
      'Serenidad bajo presión',
      'Liderazgo y comunicación',
    ],
  },
]

const AREAS_PORTERO: AreaRadar[] = [
  {
    etiqueta: 'Físico',
    criterios: [
      'Explosividad',
      'Agilidad',
      'Potencia de salto',
      'Alcance aéreo',
      'Velocidad de desplazamiento',
    ],
  },
  {
    etiqueta: 'Técnica',
    criterios: ['Blocaje', 'Desvíos y rechaces', 'Estiradas'],
  },
  {
    etiqueta: 'Juego',
    criterios: [
      'Juego de pies',
      'Pase corto',
      'Desplazamiento largo',
      'Saque de mano',
      'Golpeo con pierna no dominante',
    ],
  },
  {
    etiqueta: 'Salidas',
    criterios: ['1 contra 1', 'Salidas aéreas', 'Salidas al espacio'],
  },
  {
    etiqueta: 'Área',
    criterios: [
      'Colocación',
      'Dominio del área',
      'Lectura de centros',
      'Organización defensiva',
      'Gestión de la línea defensiva',
    ],
  },
  {
    etiqueta: 'Mental',
    criterios: [
      'Concentración',
      'Toma de decisiones',
      'Serenidad bajo presión',
      'Valentía',
      'Comunicación y liderazgo',
      'Capacidad de reacción tras error',
    ],
  },
]

const CENTRO = 100
const RADIO = 66

function mediaArea(
  area: AreaRadar,
  valoracionesPorNombre: Map<string, ResumenValoracionCriterio>,
) {
  const valoraciones = area.criterios
    .map((criterio) => valoracionesPorNombre.get(criterio)?.media)
    .filter((media): media is number => media !== undefined)

  if (valoraciones.length === 0) return null

  return valoraciones.reduce((suma, media) => suma + media, 0) / valoraciones.length
}

function coordenadas(angulo: number, radio: number) {
  return {
    x: CENTRO + Math.cos(angulo) * radio,
    y: CENTRO + Math.sin(angulo) * radio,
  }
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
    const extremo = coordenadas(angulo, RADIO)
    const etiqueta = coordenadas(angulo, RADIO + 17)
    const valor = mediaArea(area, valoracionesPorNombre)
    const punto = coordenadas(angulo, ((valor ?? 0) / 20) * RADIO)

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
              const punto = coordenadas(angulo, RADIO * anillo)
              return `${punto.x},${punto.y}`
            }).join(' ')}
          />
        ))}

        {puntos.map((punto) => (
          <line
            className="player-profile-radar-axis"
            key={punto.etiqueta}
            x1={CENTRO}
            x2={punto.extremoX}
            y1={CENTRO}
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
