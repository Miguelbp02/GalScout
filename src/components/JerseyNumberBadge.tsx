import { useId } from 'react'

interface JerseyNumberBadgeProps {
  dorsal: number | null
  size?: number
  className?: string
}

const SILUETA =
  'M38 4 C29 10 16 12 8 19 L2 32 L14 44 L22 36 L20 60 L18 96 C18 99 20 100 23 100 L77 100 C80 100 82 99 82 96 L80 60 L78 36 L86 44 L98 32 L92 19 C84 12 71 10 62 4 C58 11 54 14.5 50 14.5 C46 14.5 42 11 38 4 Z'

function JerseyNumberBadge({ dorsal, size = 40, className = '' }: JerseyNumberBadgeProps) {
  const idBase = useId().replace(/:/g, '')
  const idRecorte = `jersey-recorte-${idBase}`

  return (
    <svg
      aria-label={dorsal === null ? 'Sin dorsal' : `Dorsal ${dorsal}`}
      className={`jersey-number-badge ${className}`}
      height={size}
      role="img"
      viewBox="0 0 100 104"
      width={size}
    >
      <defs>
        <clipPath id={idRecorte}>
          <path d={SILUETA} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${idRecorte})`}>
        <rect className="jersey-number-badge-cuerpo" height="104" width="100" x="0" y="0" />
        <rect className="jersey-number-badge-hem" height="4" width="100" x="0" y="93" />
      </g>

      <path className="jersey-number-badge-contorno" d={SILUETA} fill="none" />

      <path
        className="jersey-number-badge-cuello"
        d="M38 2 C43 10 46.5 11 50 11 C53.5 11 57 10 62 2 L62 4 C57 12 53.5 14.5 50 14.5 C46.5 14.5 43 12 38 4 Z"
      />

      <path className="jersey-number-badge-puno" d="M14 42 L24 36" fill="none" />
      <path className="jersey-number-badge-puno" d="M86 42 L76 36" fill="none" />

      <path className="jersey-number-badge-arruga" d="M25 40 Q29 46 26 52" fill="none" />
      <path className="jersey-number-badge-arruga" d="M75 40 Q71 46 74 52" fill="none" />

      {dorsal !== null && (
        <text
          className="jersey-number-badge-numero"
          dominantBaseline="middle"
          textAnchor="middle"
          x="50"
          y="66"
        >
          {dorsal}
        </text>
      )}
    </svg>
  )
}

export default JerseyNumberBadge
