import { useId } from 'react'
import type { PiernaDominante as TipoPiernaDominante } from '../types/jugador'
import './DominantFootIndicator.css'

interface DominantFootIndicatorProps {
  piernaDominante: TipoPiernaDominante
  onCambiar?: (pierna: TipoPiernaDominante) => void
  conEtiqueta?: boolean
  disabled?: boolean
  className?: string
}

const ETIQUETAS: Record<TipoPiernaDominante, string> = {
  Izquierda: 'Zurdo',
  Derecha: 'Diestro',
  Ambas: 'Ambidiestro',
}

function Bota({
  lado,
  activa,
}: {
  lado: 'Izquierda' | 'Derecha'
  activa: boolean
}) {
  const idMascara = `bota-${useId().replace(/:/g, '')}`
  const esIzquierda = lado === 'Izquierda'

  return (
    <svg
      aria-hidden="true"
      className={`pierna-pie pierna-pie-${lado.toLowerCase()} ${
        activa ? 'pierna-pie-activa' : ''
      }`}
      viewBox="0 0 140 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask id={idMascara}>
        <g transform={esIzquierda ? 'translate(140 0) scale(-1 1)' : undefined}>
          {/* Bota baja de fútbol vista de perfil, con puntera y talón definidos. */}
          <path
            d="M 27 23 C 36 18 46 20 51 29 L 60 48 C 70 58 84 62 105 67 L 121 71 C 128 73 132 78 130 83 C 128 87 123 88 114 88 L 20 88 C 14 88 11 85 12 79 L 16 52 C 17 39 20 29 27 23 Z"
            fill="#fff"
          />
          {/* Suela continua, visible por los tacos que sobresalen. */}
          <path d="M 16 82 H 126 V 90 H 16 Z" fill="#fff" />
          <g fill="#fff">
            <path d="M 18 89 H 30 L 28 100 H 21 Z" />
            <path d="M 47 89 H 59 L 57 100 H 50 Z" />
            <path d="M 76 89 H 88 L 86 100 H 79 Z" />
            <path d="M 105 89 H 117 L 115 100 H 108 Z" />
          </g>
          {/* Recorte del collar y de los cordones. */}
          <g stroke="#000" strokeLinecap="round" strokeWidth="4">
            <line x1="33" x2="47" y1="31" y2="31" />
            <line x1="38" x2="52" y1="39" y2="39" />
            <line x1="43" x2="57" y1="47" y2="47" />
          </g>
        </g>
      </mask>
      <rect fill="currentColor" height="100" mask={`url(#${idMascara})`} width="140" />
    </svg>
  )
}

function DominantFootIndicator({
  piernaDominante,
  onCambiar,
  conEtiqueta = false,
  disabled = false,
  className = '',
}: DominantFootIndicatorProps) {
  const interactivo = Boolean(onCambiar) && !disabled

  function esActiva(lado: 'Izquierda' | 'Derecha') {
    return piernaDominante === lado || piernaDominante === 'Ambas'
  }

  function alternar(lado: 'Izquierda' | 'Derecha') {
    if (!onCambiar) return

    if (piernaDominante === 'Ambas') {
      onCambiar(lado)
      return
    }

    if (piernaDominante === lado) {
      onCambiar('Ambas')
      return
    }

    onCambiar(lado)
  }

  return (
    <span
      aria-label={`Pierna dominante: ${ETIQUETAS[piernaDominante]}`}
      className={`pierna-dominante ${className}`}
      role={interactivo ? 'group' : 'img'}
    >
      <span className="pierna-pies">
        {(['Izquierda', 'Derecha'] as const).map((lado) => (
          <button
            aria-label={`Pie ${lado.toLowerCase()}${
              esActiva(lado) ? ' (dominante)' : ''
            }`}
            aria-pressed={esActiva(lado)}
            className="pierna-pie-boton"
            disabled={!interactivo}
            key={lado}
            type="button"
            onClick={() => alternar(lado)}
          >
            <Bota activa={esActiva(lado)} lado={lado} />
          </button>
        ))}
      </span>
      {conEtiqueta && <span className="pierna-etiqueta">{ETIQUETAS[piernaDominante]}</span>}
    </span>
  )
}

export default DominantFootIndicator
