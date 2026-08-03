import { useState, type FormEvent } from 'react'
import type { NuevaValoracionGeneral } from '../types/valoracionGeneral'
import { useToast } from './ToastContext'

interface GeneralRatingFormProps {
  onCrearValoracion: (valoracion: NuevaValoracionGeneral) => Promise<void>
}

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function GeneralRatingForm({ onCrearValoracion }: GeneralRatingFormProps) {
  const [fechaValoracion, setFechaValoracion] = useState(obtenerFechaActual)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    setError(null)
    setGuardando(true)

    try {
      await onCrearValoracion({
        fechaValoracion,
        comentario,
      })
      setFechaValoracion(obtenerFechaActual())
      setComentario('')
      mostrarToast('Informe general guardado')
    } catch {
      setError('No se ha podido guardar el informe general.')
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

        <div className="col-12">
          <label className="form-label" htmlFor="comentario-general">
            Informe general
          </label>
          <textarea
            className="form-control"
            disabled={guardando}
            id="comentario-general"
            placeholder="Escribe con calma el informe general del jugador: lo que has visto, cómo evoluciona, puntos fuertes y débiles, contexto que te parezca relevante..."
            rows={6}
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
        {guardando ? 'Guardando…' : 'Guardar informe general'}
      </button>
    </form>
  )
}

export default GeneralRatingForm
