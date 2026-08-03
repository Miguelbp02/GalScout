import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import { useToast } from '../components/ToastContext'
import { supabase } from '../lib/supabase'
import {
  crearSugerencia,
  eliminarSugerencia,
  obtenerSugerencias,
} from '../services/suggestionService'
import type { Sugerencia, TipoSugerencia } from '../types/sugerencia'

function formatearFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SuggestionsPage() {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoSugerencia>('mejora')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  useEffect(() => {
    async function cargarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSesion(session)
    }

    void cargarSesion()
  }, [])

  useEffect(() => {
    async function cargarSugerencias() {
      setCargando(true)
      setError(null)

      try {
        const sugerenciasObtenidas = await obtenerSugerencias()
        setSugerencias(sugerenciasObtenidas)
      } catch {
        setError('No se han podido cargar las sugerencias.')
      } finally {
        setCargando(false)
      }
    }

    void cargarSugerencias()
  }, [])

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!mensaje.trim()) return

    setGuardando(true)

    try {
      await crearSugerencia({ tipo, mensaje })
      setMensaje('')
      setTipo('mejora')
      mostrarToast('Gracias, se ha guardado tu nota')
      const sugerenciasObtenidas = await obtenerSugerencias()
      setSugerencias(sugerenciasObtenidas)
    } catch {
      setError('No se ha podido guardar la sugerencia.')
    } finally {
      setGuardando(false)
    }
  }

  async function borrarSugerencia(id: string) {
    try {
      await eliminarSugerencia(id)
      setSugerencias((actuales) => actuales.filter((sugerencia) => sugerencia.id !== id))
      mostrarToast('Sugerencia eliminada')
    } catch {
      mostrarToast('No se ha podido eliminar la sugerencia')
    }
  }

  return (
    <main className="app-shell">
      <AppHeader
        email={sesion?.user.email}
        onCerrarSesion={() => void supabase.auth.signOut()}
      />

      <div className="mt-4">
        <h2 className="h3 mb-1">Mejoras</h2>
        <p className="text-body-secondary mb-0">
          Deja aquí cualquier bug que encuentres o idea para que la app sea más útil.
        </p>
      </div>

      <section className="card player-detail-summary mt-4 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={enviarFormulario}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="tipo-sugerencia">
                  Tipo
                </label>
                <select
                  className="form-select"
                  disabled={guardando}
                  id="tipo-sugerencia"
                  value={tipo}
                  onChange={(evento) => setTipo(evento.target.value as TipoSugerencia)}
                >
                  <option value="mejora">Idea de mejora</option>
                  <option value="bug">Bug / error</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="mensaje-sugerencia">
                  Nota
                </label>
                <textarea
                  className="form-control"
                  disabled={guardando}
                  id="mensaje-sugerencia"
                  placeholder="Cuenta qué ha pasado o qué añadirías: cuanto más contexto, mejor."
                  required
                  rows={4}
                  value={mensaje}
                  onChange={(evento) => setMensaje(evento.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary mt-3" disabled={guardando} type="submit">
              {guardando ? 'Guardando…' : 'Enviar nota'}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-4">
        <h3 className="h5 mb-3">Historial</h3>

        {cargando && <p className="text-body-secondary">Cargando sugerencias…</p>}

        {!cargando && sugerencias.length === 0 && (
          <p className="text-body-secondary">Todavía no hay ninguna nota.</p>
        )}

        {!cargando && sugerencias.length > 0 && (
          <div className="d-grid gap-2">
            {sugerencias.map((sugerencia) => (
              <div
                className="general-rating-item d-flex align-items-start justify-content-between gap-3"
                key={sugerencia.id}
              >
                <div>
                  <span
                    className={`badge me-2 ${
                      sugerencia.tipo === 'bug' ? 'text-bg-danger' : 'text-bg-info'
                    }`}
                  >
                    {sugerencia.tipo === 'bug' ? 'Bug' : 'Mejora'}
                  </span>
                  <span className="small text-body-secondary">
                    {formatearFecha(sugerencia.createdAt)} · {sugerencia.autorNombre}
                  </span>
                  <p className="mb-0 mt-1">{sugerencia.mensaje}</p>
                </div>

                {sesion?.user.id === sugerencia.autorId && (
                  <button
                    className="btn btn-sm btn-outline-danger flex-shrink-0"
                    type="button"
                    onClick={() => void borrarSugerencia(sugerencia.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AppFooter />
    </main>
  )
}

export default SuggestionsPage
