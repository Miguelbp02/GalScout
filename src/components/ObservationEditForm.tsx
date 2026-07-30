import { useEffect, useId, useState } from 'react'
import CriteriaRatingsInput from './CriteriaRatingsInput'
import { obtenerCriteriosScouting } from '../services/criteriaService'
import { obtenerEquipos } from '../services/teamService'
import type { CriterioScouting, PerfilScouting } from '../types/criterio'
import type { NuevaObservacion, ObservacionJugador, TipoObservacion } from '../types/observacion'

interface ObservationEditFormProps {
  observacion: ObservacionJugador
  perfilScouting: PerfilScouting
  equipoActualJugador: string | null
  onGuardar: (observacion: NuevaObservacion) => Promise<void>
  onEliminar: () => Promise<void>
  onCancelar: () => void
}

function ObservationEditForm({
  observacion,
  perfilScouting,
  equipoActualJugador,
  onGuardar,
  onEliminar,
  onCancelar,
}: ObservationEditFormProps) {
  const idListaEquipos = useId()

  const [tipo, setTipo] = useState<TipoObservacion>(observacion.tipo ?? 'entrenamiento')
  const [fechaObservacion, setFechaObservacion] = useState(observacion.fechaObservacion)
  const [equipoJugador, setEquipoJugador] = useState(
    observacion.equipoJugador ?? equipoActualJugador ?? '',
  )
  const [equipoRival, setEquipoRival] = useState(observacion.equipoRival ?? '')
  const [competicion, setCompeticion] = useState(observacion.competicion ?? '')
  const [jornada, setJornada] = useState(observacion.jornada ?? '')
  const [notas, setNotas] = useState(observacion.notas)
  const [criterios, setCriterios] = useState<CriterioScouting[]>([])
  const [puntuaciones, setPuntuaciones] = useState<Record<number, string>>({})
  const [cargandoCriterios, setCargandoCriterios] = useState(true)
  const [nombresEquipos, setNombresEquipos] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerEquipos()
      .then((equipos) => setNombresEquipos(equipos.map((equipo) => equipo.nombre)))
      .catch(() => setNombresEquipos([]))
  }, [])

  useEffect(() => {
    async function cargarCriterios() {
      setCargandoCriterios(true)

      try {
        const criteriosObtenidos = await obtenerCriteriosScouting(perfilScouting)
        setCriterios(criteriosObtenidos)

        const puntuacionesPorNombre = new Map(
          observacion.valoraciones.map((valoracion) => [
            valoracion.criterioNombre,
            valoracion.puntuacion,
          ]),
        )

        setPuntuaciones(
          Object.fromEntries(
            criteriosObtenidos.flatMap((criterio) => {
              const puntuacion = puntuacionesPorNombre.get(criterio.nombre)
              return puntuacion === undefined ? [] : [[criterio.id, String(puntuacion)]]
            }),
          ),
        )
      } catch {
        setCriterios([])
      } finally {
        setCargandoCriterios(false)
      }
    }

    void cargarCriterios()
    // Solo se carga una vez, al entrar en modo edición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function actualizarPuntuacion(criterioId: number, valor: string) {
    setPuntuaciones((actual) => ({ ...actual, [criterioId]: valor }))
  }

  async function guardar() {
    const notasLimpias = notas.trim()

    if (!notasLimpias) {
      setError('Escribe una observación antes de guardar.')
      return
    }

    const valoraciones = criterios.flatMap((criterio) => {
      const texto = puntuaciones[criterio.id]?.trim() ?? ''
      if (!texto) return []
      return [{ criterioId: criterio.id, puntuacion: Number(texto) }]
    })

    setError(null)
    setGuardando(true)

    try {
      await onGuardar({
        tipo,
        fechaObservacion,
        notas: notasLimpias,
        equipoJugador: tipo === 'partido' ? equipoJugador : '',
        equipoRival: tipo === 'partido' ? equipoRival : '',
        competicion: tipo === 'partido' ? competicion : '',
        jornada: tipo === 'partido' ? jornada : '',
        valoraciones,
      })
    } catch {
      setError('No se han podido guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (
      !window.confirm(
        '¿Eliminar este informe? Esta acción no se puede deshacer.',
      )
    ) {
      return
    }

    setEliminando(true)
    setError(null)

    try {
      await onEliminar()
    } catch {
      setError('No se ha podido eliminar el informe. Inténtalo de nuevo.')
      setEliminando(false)
    }
  }

  const ocupado = guardando || eliminando

  return (
    <div className="observation-edit-form">
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="editar-tipo-observacion">
            Tipo
          </label>
          <select
            className="form-select"
            disabled={ocupado}
            id="editar-tipo-observacion"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value as TipoObservacion)}
          >
            <option value="entrenamiento">Entrenamiento</option>
            <option value="partido">Partido</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="editar-fecha-observacion">
            Fecha de observación
          </label>
          <input
            className="form-control"
            disabled={ocupado}
            id="editar-fecha-observacion"
            type="date"
            value={fechaObservacion}
            onChange={(evento) => setFechaObservacion(evento.target.value)}
          />
        </div>
      </div>

      {tipo === 'partido' && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="editar-equipo-jugador">
              Equipo del jugador
            </label>
            <input
              className="form-control"
              disabled={ocupado}
              id="editar-equipo-jugador"
              list={idListaEquipos}
              type="text"
              value={equipoJugador}
              onChange={(evento) => setEquipoJugador(evento.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="editar-equipo-rival">
              Rival
            </label>
            <input
              className="form-control"
              disabled={ocupado}
              id="editar-equipo-rival"
              list={idListaEquipos}
              type="text"
              value={equipoRival}
              onChange={(evento) => setEquipoRival(evento.target.value)}
            />
          </div>
          <datalist id={idListaEquipos}>
            {nombresEquipos.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>

          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="editar-competicion">
              Competición <span className="text-body-secondary">(opcional)</span>
            </label>
            <input
              className="form-control"
              disabled={ocupado}
              id="editar-competicion"
              type="text"
              value={competicion}
              onChange={(evento) => setCompeticion(evento.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label" htmlFor="editar-jornada">
              Jornada <span className="text-body-secondary">(opcional)</span>
            </label>
            <input
              className="form-control"
              disabled={ocupado}
              id="editar-jornada"
              type="text"
              value={jornada}
              onChange={(evento) => setJornada(evento.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="editar-notas">
          Notas
        </label>
        <textarea
          className="form-control"
          disabled={ocupado}
          id="editar-notas"
          rows={6}
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
        />
      </div>

      <CriteriaRatingsInput
        cargando={cargandoCriterios}
        criterios={criterios}
        disabled={ocupado}
        error={null}
        puntuaciones={puntuaciones}
        onCambiarPuntuacion={actualizarPuntuacion}
      />

      {error && (
        <p className="alert alert-danger py-2" role="alert">
          {error}
        </p>
      )}

      <div className="d-flex align-items-center justify-content-between gap-2 mt-3">
        <button
          className="btn btn-outline-danger btn-sm"
          disabled={ocupado}
          type="button"
          onClick={() => void eliminar()}
        >
          {eliminando ? 'Eliminando…' : 'Eliminar informe'}
        </button>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={ocupado}
            type="button"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={ocupado}
            type="button"
            onClick={() => void guardar()}
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ObservationEditForm
