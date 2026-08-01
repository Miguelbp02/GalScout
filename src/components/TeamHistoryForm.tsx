import { useEffect, useId, useState, type FormEvent } from 'react'
import { obtenerTemporadasRecientes } from '../constants/temporadas'
import { obtenerEquipos } from '../services/teamService'
import type { NuevoHistorialEquipo } from '../types/historialEquipo'
import { useToast } from './ToastContext'

interface TeamHistoryFormProps {
  onCrearHistorial: (historial: NuevoHistorialEquipo) => Promise<void>
  textoBoton?: string
  mensajeExito?: string
}

const temporadasRecientes = obtenerTemporadasRecientes()

function TeamHistoryForm({
  onCrearHistorial,
  textoBoton = 'Añadir al historial',
  mensajeExito = 'Etapa añadida al historial',
}: TeamHistoryFormProps) {
  const idListaEquipos = useId()
  const [nombresEquipos, setNombresEquipos] = useState<string[]>([])
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [temporada, setTemporada] = useState(temporadasRecientes[0])
  const [goles, setGoles] = useState('')
  const [partidos, setPartidos] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  useEffect(() => {
    obtenerEquipos()
      .then((equipos) => setNombresEquipos(equipos.map((equipo) => equipo.nombre)))
      .catch(() => setNombresEquipos([]))
  }, [])

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nombreLimpio = nombreEquipo.trim()

    if (!nombreLimpio) {
      setError('Indica el nombre del equipo.')
      return
    }

    setError(null)
    setGuardando(true)

    try {
      await onCrearHistorial({
        nombreEquipo: nombreLimpio,
        temporada,
        goles: goles.trim() === '' ? null : Number(goles),
        partidos: partidos.trim() === '' ? null : Number(partidos),
        notas,
      })
      setNombreEquipo('')
      setTemporada(temporadasRecientes[0])
      setGoles('')
      setPartidos('')
      setNotas('')
      mostrarToast(mensajeExito)
    } catch {
      setError('No se ha podido guardar la etapa en el historial.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviarFormulario}>
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="historial-equipo">
            Equipo
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-equipo"
            list={idListaEquipos}
            placeholder="Nombre del equipo"
            required
            type="text"
            value={nombreEquipo}
            onChange={(evento) => setNombreEquipo(evento.target.value)}
          />
          <datalist id={idListaEquipos}>
            {nombresEquipos.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="historial-temporada">
            Temporada
          </label>
          <select
            className="form-select"
            disabled={guardando}
            id="historial-temporada"
            value={temporada}
            onChange={(evento) => setTemporada(evento.target.value)}
          >
            {temporadasRecientes.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="historial-goles">
            Goles
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-goles"
            inputMode="numeric"
            min={0}
            placeholder="Sin datos"
            type="number"
            value={goles}
            onChange={(evento) => setGoles(evento.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="historial-partidos">
            Partidos
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-partidos"
            inputMode="numeric"
            min={0}
            placeholder="Sin datos"
            type="number"
            value={partidos}
            onChange={(evento) => setPartidos(evento.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="historial-notas">
            Notas
          </label>
          <textarea
            className="form-control"
            disabled={guardando}
            id="historial-notas"
            placeholder="Contexto de la etapa: rol, motivo de salida, cesión..."
            rows={3}
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary mt-3" disabled={guardando} type="submit">
        {guardando ? 'Guardando…' : textoBoton}
      </button>
    </form>
  )
}

export default TeamHistoryForm
