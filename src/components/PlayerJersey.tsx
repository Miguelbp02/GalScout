import { useId, type SVGProps } from 'react'

interface PlayerJerseyProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  numero?: number | null
  colorPrincipal?: string
  titulo?: string
}

const COLOR_POR_DEFECTO = '#17694f'

function normalizarHex(color: string) {
  const valor = color.trim()

  if (/^#[0-9a-f]{6}$/i.test(valor)) {
    return valor.toLowerCase()
  }

  if (/^#[0-9a-f]{3}$/i.test(valor)) {
    const [rojo, verde, azul] = valor.slice(1).split('')
    return `#${rojo}${rojo}${verde}${verde}${azul}${azul}`.toLowerCase()
  }

  return COLOR_POR_DEFECTO
}

function mezclarColor(color: string, destino: [number, number, number], cantidad: number) {
  const valor = color.slice(1)
  const origen = [0, 2, 4].map((indice) => Number.parseInt(valor.slice(indice, indice + 2), 16))
  const mezcla = origen.map((canal, indice) =>
    Math.round(canal + (destino[indice] - canal) * cantidad),
  )

  return `#${mezcla.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}

function obtenerLuminancia(color: string) {
  const valor = color.slice(1)
  const canales = [0, 2, 4].map((indice) => {
    const canal = Number.parseInt(valor.slice(indice, indice + 2), 16) / 255
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2]
}

function normalizarNumero(numero?: number | null) {
  if (numero == null || !Number.isFinite(numero)) {
    return null
  }

  return Math.min(99, Math.max(1, Math.trunc(numero)))
}

function PlayerJersey({
  numero,
  colorPrincipal = COLOR_POR_DEFECTO,
  titulo,
  ...svgProps
}: PlayerJerseyProps) {
  const idBase = useId().replace(/:/g, '')
  const dorsal = normalizarNumero(numero)
  const colorBase = normalizarHex(colorPrincipal)
  const colorClaro = mezclarColor(colorBase, [255, 255, 255], 0.24)
  const colorOscuro = mezclarColor(colorBase, [0, 0, 0], 0.46)
  const camisetaClara = obtenerLuminancia(colorBase) > 0.5
  const colorDorsal = camisetaClara ? '#101817' : '#f8fbfa'
  const sombraDorsal = camisetaClara ? '#ffffff' : '#06110d'
  const tituloAccesible = titulo ?? (dorsal == null ? 'Camiseta sin dorsal' : `Camiseta con dorsal ${dorsal}`)

  const ids = {
    base: `${idBase}-camiseta-base`,
    lateralIzquierdo: `${idBase}-lateral-izquierdo`,
    lateralDerecho: `${idBase}-lateral-derecho`,
    hombros: `${idBase}-luz-hombros`,
    recorte: `${idBase}-recorte-camiseta`,
    sombra: `${idBase}-sombra-camiseta`,
    relieveDorsal: `${idBase}-relieve-dorsal`,
  }

  const silueta =
    'M78 30 Q100 39 122 30 L144 38 Q159 41 170 54 L192 82 L171 119 L149 107 L154 204 Q100 218 46 204 L51 107 L29 119 L8 82 L30 54 Q41 41 56 38 Z'

  return (
    <svg
      viewBox="0 0 200 230"
      role="img"
      aria-label={tituloAccesible}
      preserveAspectRatio="xMidYMid meet"
      {...svgProps}
    >
      <defs>
        <linearGradient id={ids.base} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colorClaro} />
          <stop offset="0.48" stopColor={colorBase} />
          <stop offset="1" stopColor={colorOscuro} />
        </linearGradient>

        <linearGradient id={ids.lateralIzquierdo} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colorOscuro} stopOpacity="0.72" />
          <stop offset="1" stopColor={colorBase} stopOpacity="0" />
        </linearGradient>

        <linearGradient id={ids.lateralDerecho} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={colorOscuro} stopOpacity="0.72" />
          <stop offset="1" stopColor={colorBase} stopOpacity="0" />
        </linearGradient>

        <linearGradient id={ids.hombros} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <clipPath id={ids.recorte}>
          <path d={silueta} />
        </clipPath>

        <filter id={ids.sombra} x="-30%" y="-25%" width="160%" height="175%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor="#000000"
            floodOpacity="0.32"
          />
        </filter>

        <filter id={ids.relieveDorsal} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow
            dx="1.8"
            dy="2.4"
            stdDeviation="0.7"
            floodColor="#000000"
            floodOpacity="0.36"
          />
        </filter>
      </defs>

      <ellipse cx="100" cy="214" rx="58" ry="7" fill="#000000" opacity="0.22" />

      <g filter={`url(#${ids.sombra})`}>
        <path
          d={silueta}
          fill={`url(#${ids.base})`}
          stroke={mezclarColor(colorOscuro, [0, 0, 0], 0.16)}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <g clipPath={`url(#${ids.recorte})`}>
          <path
            d="M5 80 L30 53 Q43 40 61 37 L52 111 L28 123 Z"
            fill={`url(#${ids.lateralIzquierdo})`}
          />
          <path
            d="M195 80 L170 53 Q157 40 139 37 L148 111 L172 123 Z"
            fill={`url(#${ids.lateralDerecho})`}
          />

          <path
            d="M42 93 C56 113 59 165 49 209 L72 214 L78 74 L56 38 Z"
            fill="#000000"
            opacity="0.11"
          />
          <path
            d="M158 93 C144 113 141 165 151 209 L128 214 L122 74 L144 38 Z"
            fill="#000000"
            opacity="0.11"
          />

          <path
            d="M54 37 Q100 63 146 37 L153 69 Q100 49 47 69 Z"
            fill={`url(#${ids.hombros})`}
            opacity="0.88"
          />
          <path
            d="M77 34 Q100 48 123 34 L121 50 Q100 61 79 50 Z"
            fill="#000000"
            opacity="0.12"
          />
          <path
            d="M48 64 Q68 50 82 48 Q100 59 118 48 Q132 50 152 64 Q100 83 48 64 Z"
            fill="#000000"
            opacity="0.065"
          />
          <path
            d="M47 184 Q100 199 153 184 L154 205 Q100 218 46 205 Z"
            fill="#000000"
            opacity="0.08"
          />

          <path d="M100 57 L100 204" stroke="#ffffff" strokeOpacity="0.055" />
          <path
            d="M48 64 Q100 83 152 64"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.13"
            strokeWidth="1.1"
          />
          <path
            d="M51 107 L29 119 M149 107 L171 119"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.24"
            strokeWidth="1.3"
          />
          <path
            d="M47 202 Q100 214 153 202"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.2"
            strokeWidth="1.3"
          />

          <path d="M8 82 L29 119 M192 82 L171 119" fill="none" stroke="#ffffff" strokeWidth="4.2" />
          <path d="M13 79 L34 116 M187 79 L166 116" fill="none" stroke="#ffffff" strokeWidth="1.8" />
        </g>

        <path
          d="M77 29 Q100 41 123 29 L121 38 Q100 48 79 38 Z"
          fill="#10191a"
          fillOpacity="0.94"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M81 32 Q100 41 119 32 L118 36 Q100 44 82 36 Z"
          fill={colorClaro}
        />

        <path
          d="M78 31 Q66 33 56 38 Q42 41 30 54 L8 82"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M122 31 Q134 33 144 38 Q158 41 170 54 L192 82"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {dorsal != null && (
          <g filter={`url(#${ids.relieveDorsal})`}>
            <text
              x="102"
              y="166"
              textAnchor="middle"
              fill={sombraDorsal}
              stroke={sombraDorsal}
              strokeWidth="3"
              strokeLinejoin="round"
              opacity="0.55"
              fontFamily={'Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif'}
              fontSize={dorsal < 10 ? 116 : 104}
              fontWeight="900"
              letterSpacing={dorsal < 10 ? 0 : -3}
              style={{ paintOrder: 'stroke fill' }}
            >
              {dorsal}
            </text>
            <text
              x="100"
              y="163"
              textAnchor="middle"
              fill={colorDorsal}
              stroke={colorDorsal}
              strokeWidth="1.5"
              strokeLinejoin="round"
              fontFamily={'Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif'}
              fontSize={dorsal < 10 ? 116 : 104}
              fontWeight="900"
              letterSpacing={dorsal < 10 ? 0 : -3}
              style={{ paintOrder: 'stroke fill' }}
            >
              {dorsal}
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}

export default PlayerJersey

