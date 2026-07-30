import { useEffect, useRef, useState } from 'react'
import CriteriaRatingsInput from './CriteriaRatingsInput'
import TrashIcon from './TrashIcon'
import { useMatchSession } from './MatchSessionContext'
import { useToast } from './ToastContext'
import { obtenerCriteriosScouting } from '../services/criteriaService'
import {
  crearAccionesObservacion,
  crearObservacionJugador,
} from '../services/observationService'
import type { CriterioScouting, PerfilScouting } from '../types/criterio'

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

interface ResultadoEdicion {
  texto: string
  cursor: number
}

function MatchNotebook() {
  const {
    sesion,
    actualizarInforme,
    eliminarAccion,
    marcarInformeGuardado,
    cambiarPestanaActiva,
    actualizarPuntuacionJugador,
  } = useMatchSession()
  const { mostrarToast } = useToast()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [criteriosPorPerfil, setCriteriosPorPerfil] = useState<
    Partial<Record<PerfilScouting, CriterioScouting[]>>
  >({})
  const [guardandoJugadorId, setGuardandoJugadorId] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const jugadorActivo = sesion?.jugadores.find(
    (jugador) => jugador.id === sesion.pestanaActiva,
  )

  useEffect(() => {
    if (!jugadorActivo || criteriosPorPerfil[jugadorActivo.perfilScouting]) return

    obtenerCriteriosScouting(jugadorActivo.perfilScouting)
      .then((criterios) =>
        setCriteriosPorPerfil((actual) => ({
          ...actual,
          [jugadorActivo.perfilScouting]: criterios,
        })),
      )
      .catch(() => {})
  }, [jugadorActivo, criteriosPorPerfil])

  if (!sesion || !jugadorActivo) return null

  const textoInforme = sesion.informesPorJugador[jugadorActivo.id] ?? ''
  const accionesDelJugador = sesion.acciones.filter(
    (accion) => accion.jugadorId === jugadorActivo.id,
  )
  const yaGuardado = sesion.jugadoresGuardados.includes(jugadorActivo.id)
  const criteriosActivos = criteriosPorPerfil[jugadorActivo.perfilScouting] ?? []
  const puntuacionesActivas = sesion.puntuacionesPorJugador[jugadorActivo.id] ?? {}

  function editarEnCursor(
    transformar: (texto: string, inicio: number, fin: number) => ResultadoEdicion,
  ) {
    const textarea = textareaRef.current
    if (!textarea) return

    const resultado = transformar(
      textoInforme,
      textarea.selectionStart,
      textarea.selectionEnd,
    )

    actualizarInforme(jugadorActivo!.id, resultado.texto)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(resultado.cursor, resultado.cursor)
    })
  }

  function aplicarNegrita() {
    editarEnCursor((texto, inicio, fin) => {
      const seleccion = texto.slice(inicio, fin)

      if (seleccion) {
        return {
          texto: `${texto.slice(0, inicio)}**${seleccion}**${texto.slice(fin)}`,
          cursor: fin + 4,
        }
      }

      return {
        texto: `${texto.slice(0, inicio)}****${texto.slice(inicio)}`,
        cursor: inicio + 2,
      }
    })
  }

  function alternarTitulo() {
    editarEnCursor((texto, inicio) => {
      const inicioLinea = texto.lastIndexOf('\n', inicio - 1) + 1

      if (texto.startsWith('# ', inicioLinea)) {
        return {
          texto: texto.slice(0, inicioLinea) + texto.slice(inicioLinea + 2),
          cursor: Math.max(inicioLinea, inicio - 2),
        }
      }

      return {
        texto: `${texto.slice(0, inicioLinea)}# ${texto.slice(inicioLinea)}`,
        cursor: inicio + 2,
      }
    })
  }

  function mencionarAccion(minuto: number, etiquetaNombre: string) {
    editarEnCursor((texto, inicio, fin) => {
      const referencia = `**${minuto}' ${etiquetaNombre}** — `

      return {
        texto: texto.slice(0, inicio) + referencia + texto.slice(fin),
        cursor: inicio + referencia.length,
      }
    })
  }

  async function guardarInforme() {
    const jugador = jugadorActivo!
    const equipoJugador =
      jugador.equipo === 'A' ? sesion!.nombreEquipoA : sesion!.nombreEquipoB
    const equipoRival =
      jugador.equipo === 'A' ? sesion!.nombreEquipoB : sesion!.nombreEquipoA

    setErrorGuardado(null)
    setGuardandoJugadorId(jugador.id)

    try {
      const valoraciones = Object.entries(puntuacionesActivas).flatMap(
        ([criterioId, valor]) => {
          const texto = valor.trim()
          if (!texto) return []
          return [{ criterioId: Number(criterioId), puntuacion: Number(texto) }]
        },
      )

      const observacionId = await crearObservacionJugador(jugador.id, {
        tipo: 'partido',
        fechaObservacion: obtenerFechaActual(),
        notas: textoInforme.trim() || 'Sin notas adicionales.',
        equipoJugador,
        equipoRival,
        competicion: sesion!.competicion,
        jornada: sesion!.jornada,
        valoraciones,
      })

      await crearAccionesObservacion(
        observacionId,
        accionesDelJugador.map((accion) => ({
          etiquetaId: accion.etiquetaId,
          minuto: accion.minuto,
          parte: accion.parte,
          x: accion.x,
          y: accion.y,
          notaLibre: accion.notaLibre,
        })),
      )

      marcarInformeGuardado(jugador.id)
      mostrarToast(`Informe de ${jugador.nombre} guardado`)
    } catch {
      setErrorGuardado('No se ha podido guardar el informe. Inténtalo de nuevo.')
    } finally {
      setGuardandoJugadorId(null)
    }
  }

  return (
    <div className="match-notebook">
      <div className="match-notebook-tabs">
        {sesion.jugadores.map((jugador) => (
          <button
            className={`match-notebook-tab ${
              jugador.id === sesion.pestanaActiva ? 'match-notebook-tab--activa' : ''
            }`}
            key={jugador.id}
            style={
              jugador.id === sesion.pestanaActiva
                ? { borderBottomColor: jugador.color }
                : undefined
            }
            type="button"
            onClick={() => cambiarPestanaActiva(jugador.id)}
          >
            <i
              aria-hidden="true"
              className="match-notebook-tab-dot"
              style={{ background: jugador.color }}
            />
            {jugador.nombre}
            {sesion.jugadoresGuardados.includes(jugador.id) && ' ✓'}
          </button>
        ))}
      </div>

      <div className="match-notebook-panel">
        {yaGuardado ? (
          <p className="text-body-secondary mb-0">
            Informe de {jugadorActivo.nombre} ya guardado. Puedes seguir editando a otros
            jugadores; esta pestaña queda como registro.
          </p>
        ) : (
          <>
            <div className="match-editor-toolbar">
              <button
                className="match-icon-toggle"
                title="Negrita (envuelve el texto seleccionado)"
                type="button"
                onClick={aplicarNegrita}
              >
                <strong>B</strong>
              </button>
              <button
                className="match-icon-toggle"
                title="Convertir esta línea en título"
                type="button"
                onClick={alternarTitulo}
              >
                T
              </button>

              <details className="match-mencion-desplegable">
                <summary>+ Mencionar acción</summary>
                <div className="match-mencion-lista">
                  {accionesDelJugador.length === 0 && (
                    <p className="small text-body-secondary mb-0">
                      Este jugador todavía no tiene acciones registradas.
                    </p>
                  )}
                  {accionesDelJugador.map((accion) => (
                    <button
                      className="match-mencion-item"
                      key={accion.id}
                      type="button"
                      onClick={() =>
                        mencionarAccion(accion.minuto, accion.etiquetaNombre)
                      }
                    >
                      {accion.minuto}&apos; {accion.etiquetaNombre}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <textarea
              className="form-control match-editor-textarea"
              placeholder="Escribe aquí el informe de este jugador…"
              ref={textareaRef}
              rows={12}
              value={textoInforme}
              onChange={(evento) =>
                actualizarInforme(jugadorActivo.id, evento.target.value)
              }
            />

            <p className="match-editor-ayuda">
              <strong>**texto**</strong> se guarda en negrita y las líneas que empiezan
              por <strong># </strong> son títulos.
            </p>

            <CriteriaRatingsInput
              cargando={criteriosActivos.length === 0}
              criterios={criteriosActivos}
              error={null}
              puntuaciones={puntuacionesActivas}
              onCambiarPuntuacion={(criterioId, valor) =>
                actualizarPuntuacionJugador(jugadorActivo.id, criterioId, valor)
              }
            />

            {errorGuardado && (
              <p className="alert alert-danger py-2" role="alert">
                {errorGuardado}
              </p>
            )}

            <button
              className="btn btn-primary align-self-end"
              disabled={guardandoJugadorId === jugadorActivo.id}
              type="button"
              onClick={() => void guardarInforme()}
            >
              {guardandoJugadorId === jugadorActivo.id
                ? 'Guardando…'
                : `Guardar informe de ${jugadorActivo.nombre}`}
            </button>
          </>
        )}

        <div className="match-action-log">
          <p className="match-action-log-titulo">
            Acciones registradas ({sesion.acciones.length})
          </p>
          <div className="match-action-log-lista">
            {sesion.acciones.length === 0 && (
              <p className="small text-body-secondary mb-0">
                Todavía no se ha registrado ninguna acción.
              </p>
            )}
            {[...sesion.acciones]
              .sort((a, b) => b.minuto - a.minuto)
              .map((accion) => {
                const jugador = sesion.jugadores.find(
                  (item) => item.id === accion.jugadorId,
                )

                return (
                  <div className="match-action-log-item" key={accion.id}>
                    <span>
                      <i
                        aria-hidden="true"
                        className="match-notebook-tab-dot"
                        style={{ background: jugador?.color }}
                      />
                      {accion.minuto}&apos; {accion.etiquetaNombre} ·{' '}
                      {jugador?.nombre ?? 'Jugador'}
                    </span>
                    <button
                      aria-label={`Eliminar acción del minuto ${accion.minuto}`}
                      className="match-accion-borrar"
                      title="Eliminar acción"
                      type="button"
                      onClick={() => eliminarAccion(accion.id)}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchNotebook
