export const ANCHO_CAMPO = 105
export const ALTO_CAMPO = 68

function PitchOutlineSvg() {
  return (
    <>
      <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.35">
        <rect height="68" width="105" x="0" y="0" />
        <line x1="52.5" x2="52.5" y1="0" y2="68" />
        <circle cx="52.5" cy="34" r="9.15" />
        <rect height="40.32" width="16.5" x="0" y="13.84" />
        <rect height="18.32" width="5.5" x="0" y="24.84" />
        <path d="M 16.5 24.85 A 9.15 9.15 0 0 1 16.5 43.15" />
        <rect height="40.32" width="16.5" x="88.5" y="13.84" />
        <rect height="18.32" width="5.5" x="99.5" y="24.84" />
        <path d="M 88.5 43.15 A 9.15 9.15 0 0 1 88.5 24.85" />
      </g>
      <g fill="rgba(255,255,255,0.85)">
        <circle cx="52.5" cy="34" r="0.45" />
        <circle cx="11" cy="34" r="0.45" />
        <circle cx="94" cy="34" r="0.45" />
      </g>
    </>
  )
}

export default PitchOutlineSvg
