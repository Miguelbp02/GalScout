import { useState } from 'react'
import { useMatchSession } from './MatchSessionContext'

function formatearMinutoSegundo(segundos: number) {
  const minutos = Math.floor(segundos / 60)
  const restoSegundos = segundos % 60
  return `${minutos}:${String(restoSegundos).padStart(2, '0')}`
}

const MINUTO_MAXIMO = 130
const MARCAS_TIEMPO = [15, 30, 45, 60, 75, 90, 105, 120]
const MARCAS_PRINCIPALES = new Set([45, 90])

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
  const [ayudaAbierta, setAyudaAbierta] = useState(false)

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
          aria-label="Cómo funciona el ojeo en directo"
          className="match-icon-button"
          title="Ayuda"
          type="button"
          onClick={() => setAyudaAbierta(true)}
        >
          ?
        </button>
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

        <div className="match-timer-track">
          <input
            aria-label="Ajustar minuto del cronómetro"
            className="match-timer-range"
            disabled={!enFaseDeJuego}
            max={MINUTO_MAXIMO}
            min={0}
            type="range"
            value={minutoPendiente ?? minutoActual}
            onChange={(evento) => setMinutoPendiente(Number(evento.target.value))}
            onMouseUp={confirmarAjuste}
            onTouchEnd={confirmarAjuste}
          />
          <div aria-hidden="true" className="match-timer-marcas">
            {MARCAS_TIEMPO.map((minuto) => (
              <span
                className={`match-timer-marca ${
                  MARCAS_PRINCIPALES.has(minuto) ? 'match-timer-marca--principal' : ''
                }`}
                key={minuto}
                style={{ left: `${(minuto / MINUTO_MAXIMO) * 100}%` }}
              >
                {MARCAS_PRINCIPALES.has(minuto) && (
                  <span className="match-timer-marca-texto">{minuto}&apos;</span>
                )}
              </span>
            ))}
          </div>
        </div>

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

      {ayudaAbierta && (
        <div
          aria-labelledby="match-help-titulo"
          aria-modal="true"
          className="match-help-backdrop"
          role="dialog"
          onClick={() => setAyudaAbierta(false)}
        >
          <div className="match-help-modal" onClick={(evento) => evento.stopPropagation()}>
            <div className="match-help-modal-header">
              <h2 id="match-help-titulo">Cómo funciona el ojeo en directo</h2>
              <button
                aria-label="Cerrar ayuda"
                className="match-icon-button"
                type="button"
                onClick={() => setAyudaAbierta(false)}
              >
                ✕
              </button>
            </div>

            <ol className="match-help-lista">
              <li>
                <strong>Activa el cronómetro</strong> en cuanto el árbitro pite el
                inicio del partido.
              </li>
              <li>
                <strong>Revisa los lados del campo.</strong> Si te equivocaste al
                elegirlos, puedes cambiarlos para que el campo interactivo represente
                tu punto de vista real, por ejemplo si estás viendo el partido desde
                una grada lateral.
              </li>
              <li>
                <strong>Ajusta el minuto cuando haga falta.</strong> El cronómetro se
                adapta a la duración del partido: tú marcas el final de la primera
                parte, el inicio de la segunda y el final del encuentro. Así puedes
                registrar tiempos añadidos anormalmente largos o partes de menos de
                45 minutos en categorías inferiores.
              </li>
              <li>
                <strong>Registra las acciones sobre el campo.</strong> Con el
                cronómetro activo, en cuanto un jugador haga una acción etiquetada,
                pincha en la zona del campo donde ha sucedido: se guarda el minuto
                automáticamente y eliges a qué acción etiquetada corresponde.
              </li>
              <li>
                <strong>Indica el jugador.</strong> Si tienes a más de un jugador en
                seguimiento a la vez, el último paso es indicar quién ha realizado
                la acción.
              </li>
              <li>
                <strong>El botón "⇅ Sustitución" calcula los minutos jugados solo.</strong>{' '}
                El programa da por hecho que los jugadores en seguimiento empiezan
                como titulares. Si en un minuto marcas que un jugador "Sale del
                campo", deja de sumar minutos desde ahí; y si marcas que "Entra al
                campo" sin haber salido antes, entiende que era suplente y que no
                estaba jugando hasta ese momento, recalculando sus minutos jugados
                en consecuencia.
              </li>
              <li>
                <strong>Comenta más rápido con "Mencionar acción".</strong> En el
                editor de texto de cada jugador, este botón te deja hacer referencia
                a una de sus acciones ya registradas para comentarla al momento.
              </li>
              <li>
                <strong>Puedes minimizar en cualquier momento.</strong> Si durante el
                partido quieres consultar las estadísticas de un jugador o cualquier
                otra función de la web, minimiza la vista con el botón ▁: el partido
                se queda guardado tal cual (cronómetro, acciones e informes) para que
                sigas trabajando cuando quieras y puedas volver a entrar después. Si
                el cronómetro estaba activado, sigue corriendo con la línea de
                tiempo del partido mientras está minimizado, así que al volver
                seguirá sincronizado con el minuto real.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchTimerBar
