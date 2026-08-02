import { useEffect, useRef, useState } from 'react'
import CriteriaRatingsInput from './CriteriaRatingsInput'
import MatchAddPlayerForm from './MatchAddPlayerForm'
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

interface PestanaNuevoJugador {
  id: string
  nombre: string
}

function generarIdPestana() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `pestana-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function MatchNotebook() {
  const {
    sesion,
    actualizarInforme,
    eliminarAccion,
    marcarInformeGuardado,
    cambiarPestanaActiva,
    actualizarPuntuacionJugador,
    eliminarJugador,
    reordenarJugadores,
  } = useMatchSession()
  const { mostrarToast } = useToast()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mencionRef = useRef<HTMLDetailsElement>(null)
  const [criteriosPorPerfil, setCriteriosPorPerfil] = useState<
    Partial<Record<PerfilScouting, CriterioScouting[]>>
  >({})
  const [guardandoJugadorId, setGuardandoJugadorId] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [pestanasNuevas, setPestanasNuevas] = useState<PestanaNuevoJugador[]>([])
  const [pestanaNuevaActivaId, setPestanaNuevaActivaId] = useState<string | null>(null)
  const [jugadorArrastradoId, setJugadorArrastradoId] = useState<string | null>(null)
  const [jugadorDestinoId, setJugadorDestinoId] = useState<string | null>(null)

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

  if (!sesion) return null

  const textoInforme = jugadorActivo
    ? (sesion.informesPorJugador[jugadorActivo.id] ?? '')
    : ''
  const accionesDelJugador = jugadorActivo
    ? sesion.acciones.filter((accion) => accion.jugadorId === jugadorActivo.id)
    : []
  const yaGuardado = jugadorActivo
    ? sesion.jugadoresGuardados.includes(jugadorActivo.id)
    : false
  const criteriosActivos = jugadorActivo
    ? (criteriosPorPerfil[jugadorActivo.perfilScouting] ?? [])
    : []
  const puntuacionesActivas = jugadorActivo
    ? (sesion.puntuacionesPorJugador[jugadorActivo.id] ?? {})
    : {}

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
      const saltoDeLinea = inicio > 0 && texto[inicio - 1] !== '\n' ? '\n' : ''
      const referencia = `${saltoDeLinea}**${minuto}' ${etiquetaNombre}** — `

      return {
        texto: texto.slice(0, inicio) + referencia + texto.slice(fin),
        cursor: inicio + referencia.length,
      }
    })

    if (mencionRef.current) {
      mencionRef.current.open = false
    }
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
          direccionAtaque: accion.direccionAtaque,
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

  function cerrarSeguimientoJugador(jugadorId: string, nombre: string) {
    const confirmado = window.confirm(
      `¿Seguro que quieres dejar de seguir a ${nombre}? Se perderán las acciones, el informe y las valoraciones no guardadas de este jugador en este partido.`,
    )
    if (!confirmado) return

    eliminarJugador(jugadorId)
    if (sesion!.jugadores.length === 1) {
      if (pestanasNuevas.length === 0) {
        abrirPestanaJugador()
      } else {
        setPestanaNuevaActivaId(pestanasNuevas[0].id)
      }
    }
  }

  function abrirPestanaJugador() {
    if (sesion!.jugadores.length + pestanasNuevas.length >= 4) return

    const id = generarIdPestana()
    setPestanasNuevas((actuales) => [...actuales, { id, nombre: '' }])
    setPestanaNuevaActivaId(id)
  }

  function cerrarPestanaJugador(pestanaId: string) {
    const restantes = pestanasNuevas.filter((pestana) => pestana.id !== pestanaId)
    setPestanasNuevas(restantes)

    if (pestanaNuevaActivaId === pestanaId) {
      setPestanaNuevaActivaId(restantes.at(-1)?.id ?? null)
    }
  }

  function actualizarNombrePestana(pestanaId: string, nombre: string) {
    setPestanasNuevas((actuales) =>
      actuales.map((pestana) =>
        pestana.id === pestanaId ? { ...pestana, nombre } : pestana,
      ),
    )
  }

  function iniciarArrastre(
    evento: React.DragEvent<HTMLButtonElement>,
    jugadorId: string,
  ) {
    evento.dataTransfer.effectAllowed = 'move'
    evento.dataTransfer.setData('text/plain', jugadorId)
    setJugadorArrastradoId(jugadorId)
  }

  function soltarJugador(
    evento: React.DragEvent<HTMLDivElement>,
    jugadorDestinoId: string,
  ) {
    evento.preventDefault()
    const jugadorOrigenId =
      evento.dataTransfer.getData('text/plain') || jugadorArrastradoId
    if (jugadorOrigenId) {
      reordenarJugadores(jugadorOrigenId, jugadorDestinoId)
    }
    setJugadorArrastradoId(null)
    setJugadorDestinoId(null)
  }

  return (
    <div className="match-notebook">
      <div className="match-notebook-tabs">
        {sesion.jugadores.map((jugador) => (
          <div
            className={`match-notebook-tab-container ${
              jugadorArrastradoId === jugador.id
                ? 'match-notebook-tab-container--arrastrando'
                : ''
            } ${
              jugadorDestinoId === jugador.id && jugadorArrastradoId !== jugador.id
                ? 'match-notebook-tab-container--destino'
                : ''
            }`}
            key={jugador.id}
            onDragOver={(evento) => {
              evento.preventDefault()
              evento.dataTransfer.dropEffect = 'move'
              setJugadorDestinoId(jugador.id)
            }}
            onDrop={(evento) => soltarJugador(evento, jugador.id)}
          >
            <button
              className={`match-notebook-tab ${
                !pestanaNuevaActivaId && jugador.id === sesion.pestanaActiva
                  ? 'match-notebook-tab--activa'
                  : ''
              }`}
              style={
                !pestanaNuevaActivaId && jugador.id === sesion.pestanaActiva
                  ? { borderBottomColor: jugador.color }
                  : undefined
              }
              draggable
              title="Arrastra para cambiar el orden"
              type="button"
              onClick={() => {
                setPestanaNuevaActivaId(null)
                cambiarPestanaActiva(jugador.id)
              }}
              onDragEnd={() => {
                setJugadorArrastradoId(null)
                setJugadorDestinoId(null)
              }}
              onDragStart={(evento) => iniciarArrastre(evento, jugador.id)}
            >
              <i
                aria-hidden="true"
                className="match-notebook-tab-dot"
                style={{ background: jugador.color }}
              />
              {jugador.nombre}
              {sesion.jugadoresGuardados.includes(jugador.id) && ' ✓'}
            </button>
            <button
              aria-label={`Dejar de seguir a ${jugador.nombre}`}
              className="match-notebook-tab-close"
              disabled={guardandoJugadorId === jugador.id}
              title={`Dejar de seguir a ${jugador.nombre}`}
              type="button"
              onClick={() => cerrarSeguimientoJugador(jugador.id, jugador.nombre)}
            >
              ×
            </button>
          </div>
        ))}
        {pestanasNuevas.map((pestana) => (
          <div className="match-notebook-tab-container" key={pestana.id}>
            <button
              className={`match-notebook-tab match-notebook-tab--añadir match-notebook-tab--añadir-abierta ${
                pestanaNuevaActivaId === pestana.id ? 'match-notebook-tab--activa' : ''
              }`}
              type="button"
              onClick={() => setPestanaNuevaActivaId(pestana.id)}
            >
              + {pestana.nombre || 'Nuevo jugador'}
            </button>
            <button
              aria-label="Cerrar pestaña de nuevo jugador"
              className="match-notebook-tab-close"
              title="Cerrar pestaña"
              type="button"
              onClick={() => cerrarPestanaJugador(pestana.id)}
            >
              ×
            </button>
          </div>
        ))}
        {sesion.jugadores.length + pestanasNuevas.length < 4 && (
          <button
            aria-label="Añadir jugador al seguimiento"
            className="match-notebook-tab match-notebook-tab--añadir"
            title="Añadir jugador al seguimiento"
            type="button"
            onClick={abrirPestanaJugador}
          >
            +
          </button>
        )}
      </div>

      <div className="match-notebook-panel">
        {pestanasNuevas.map((pestana) => (
          <div
            className={pestanaNuevaActivaId === pestana.id ? '' : 'd-none'}
            key={pestana.id}
          >
            <MatchAddPlayerForm
              onCerrar={() => cerrarPestanaJugador(pestana.id)}
              onJugadorSeleccionado={(nombre) =>
                actualizarNombrePestana(pestana.id, nombre)
              }
            />
          </div>
        ))}
        {!pestanaNuevaActivaId && jugadorActivo ? (
          <>
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

              <details className="match-mencion-desplegable" ref={mencionRef}>
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
              rows={11}
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
          </>
        ) : null}
        {!pestanaNuevaActivaId && !jugadorActivo && pestanasNuevas.length === 0 && (
          <p className="text-body-secondary mb-0">
            Pulsa + para añadir un jugador al seguimiento.
          </p>
        )}
      </div>
    </div>
  )
}

export default MatchNotebook
