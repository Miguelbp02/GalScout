import { useState, type FormEvent } from 'react'
import type { NuevaValoracionGeneral } from '../types/valoracionGeneral'

interface GeneralRatingFormProps {
  onCrearValoracion: (valoracion: NuevaValoracionGeneral) => Promise<void>
}

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function GeneralRatingForm({ onCrearValoracion }: GeneralRatingFormProps) {
  const [fechaValoracion, setFechaValoracion] = useState(obtenerFechaActual)
  const [puntuacion, setPuntuacion] = useState('')
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (puntuacion === '') {
      setError('Indica una puntuación general entre 0 y 20.')
      return
    }

    setError(null)
    setGuardando(true)

    try {
      await onCrearValoracion({
        fechaValoracion,
        puntuacion: Number(puntuacion),
        comentario,
      })
      setFechaValoracion(obtenerFechaActual())
      setPuntuacion('')
      setComentario('')
    } catch {
      setError('No se ha podido guardar la valoración general.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviarFormulario}>
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="fecha-valoracion-general">
            Fecha
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="fecha-valoracion-general"
            required
            type="date"
            value={fechaValoracion}
            onChange={(evento) => setFechaValoracion(evento.target.value)}
          />
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="puntuacion-general">
            Puntuación general (0-20)
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="puntuacion-general"
            max={20}
            min={0}
            placeholder="Ej. 14"
            required
            step={1}
            type="number"
            value={puntuacion}
            onChange={(evento) => setPuntuacion(evento.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="comentario-general">
            Comentario de síntesis
          </label>
          <textarea
            className="form-control"
            disabled={guardando}
            id="comentario-general"
            placeholder="Resume la impresión global del jugador."
            rows={3}
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary mt-3" disabled={guardando} type="submit">
        {guardando ? 'Guardando…' : 'Guardar valoración general'}
      </button>
    </form>
  )
}

export default GeneralRatingForm
