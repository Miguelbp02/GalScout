import { useState } from 'react'
import { useMatchSession } from './MatchSessionContext'

function formatearMinutoSegundo(segundos: number) {
  const minutos = Math.floor(segundos / 60)
  const restoSegundos = segundos % 60
  return `${minutos}:${String(restoSegundos).padStart(2, '0')}`
}

interface MatchTimerBarProps {
  onCerrar: () => void
  onMinimizar: () => void
}

function MatchTimerBar({ onCerrar, onMinimizar }: MatchTimerBarProps) {
  const {
    sesion,
    iniciarCronometro,
    pausarCronometro,
    irADescanso,
    iniciarSegundaParte,
    finalizarPartido,
    ajustarMinuto,
  } = useMatchSession()
  const [minutoPendiente, setMinutoPendiente] = useState<number | null>(null)

  if (!sesion) return null

  const minutoActual = Math.floor(sesion.segundos / 60)
  const enFaseDeJuego =
    sesion.estado === 'primera_parte' || sesion.estado === 'segunda_parte'

  function confirmarAjuste() {
    if (minutoPendiente === null || minutoPendiente === minutoActual) {
      setMinutoPendiente(null)
      return
    }

    const confirmado = window.confirm(
      `¿Ajustar el cronómetro de ${minutoActual}' a ${minutoPendiente}'? Esto no cambia el minuto de las acciones ya registradas.`,
    )

    if (confirmado) {
      ajustarMinuto(minutoPendiente)
    }

    setMinutoPendiente(null)
  }

  function manejarPausa() {
    const confirmado = window.confirm(
      '¿Pausar el cronómetro? El tiempo dejará de correr hasta que lo reanudes.',
    )

    if (confirmado) {
      pausarCronometro()
    }
  }

  const etiquetaParte: Record<typeof sesion.estado, string> = {
    configuracion: '',
    primera_parte: '1ª PARTE',
    descanso: 'DESCANSO',
    segunda_parte: '2ª PARTE',
    finalizado: 'FINALIZADO',
  }

  return (
    <div className="match-topbar">
      <div className="match-topbar-row">
        <button
          aria-label="Cancelar sesión de partido"
          className="match-icon-button"
          type="button"
          onClick={onCerrar}
        >
          ✕
        </button>
        <span className="match-topbar-titulo">
          Ojeando: {sesion.nombreEquipoA} vs {sesion.nombreEquipoB}
        </span>
        <button
          aria-label="Minimizar y seguir navegando"
          className="match-icon-button"
          type="button"
          onClick={onMinimizar}
        >
          ▁
        </button>
      </div>

      <div className="match-timer-row">
        <span className="match-parte-badge">{etiquetaParte[sesion.estado]}</span>

        {enFaseDeJuego && (
          <button
            className="match-icon-button match-icon-button--play"
            title={sesion.corriendo ? 'Pausar cronómetro' : 'Iniciar cronómetro'}
            type="button"
            onClick={sesion.corriendo ? manejarPausa : iniciarCronometro}
          >
            {sesion.corriendo ? '⏸' : '▶'}
          </button>
        )}

        <span className="match-timer-valor">{formatearMinutoSegundo(sesion.segundos)}</span>

        <input
          aria-label="Ajustar minuto del cronómetro"
          className="match-timer-range"
          disabled={!enFaseDeJuego}
          max={130}
          min={0}
          type="range"
          value={minutoPendiente ?? minutoActual}
          onChange={(evento) => setMinutoPendiente(Number(evento.target.value))}
          onMouseUp={confirmarAjuste}
          onTouchEnd={confirmarAjuste}
        />

        {sesion.estado === 'primera_parte' && (
          <button className="match-topbar-action" type="button" onClick={irADescanso}>
            Ir al descanso
          </button>
        )}
        {sesion.estado === 'descanso' && (
          <button
            className="match-topbar-action match-topbar-action--activa"
            type="button"
            onClick={iniciarSegundaParte}
          >
            Iniciar 2ª parte
          </button>
        )}
        {sesion.estado === 'segunda_parte' && (
          <button
            className="match-topbar-action match-topbar-action--peligro"
            type="button"
            onClick={finalizarPartido}
          >
            Finalizar partido
          </button>
        )}
      </div>
    </div>
  )
}

export default MatchTimerBar
