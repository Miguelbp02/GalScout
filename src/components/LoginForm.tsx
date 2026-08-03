import { useState, type FormEvent } from 'react'
import logoAppOjeo from '../assets/logoAppOjeo.png'
import { supabase } from '../lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setCargando(true)

    const { error: errorInicioSesion } = await supabase.auth.signInWithPassword({
      email,
      password: contraseña,
    })

    if (errorInicioSesion) {
      setError('No se ha podido iniciar sesión. Revisa el correo y la contraseña.')
    }

    setCargando(false)
  }

  return (
    <main className="login-shell">
      <section className="card login-card shadow-sm" aria-labelledby="login-title">
        <div className="card-body p-4 p-md-5">
          <div className="app-brand mb-3">
            <div className="app-logo-crop app-logo-crop-login">
              <img src={logoAppOjeo} alt="Logo de Ojeo Galicia" />
            </div>
            <div>
              <h1 className="app-brand-title mb-1" aria-label="GalScout">
                <span>Gal</span>
                <span>Scout</span>
              </h1>
              <p id="login-title" className="h3 mb-0">
                Acceso privado
              </p>
            </div>
          </div>
          <p className="text-body-secondary mb-3">
            Inicia sesión con la cuenta proporcionada por el administrador.
          </p>

          <p className="alert alert-warning py-2 small mb-4" role="note">
            Esto es un prototipo en desarrollo: los jugadores y datos que vas a ver
            son ficticios, a modo de ejemplo. Todavía está sujeto a cambios y a
            adaptarse a las necesidades de los usuarios.
          </p>

          <form onSubmit={iniciarSesion}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                className="form-control"
                disabled={cargando}
                id="email"
                required
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="contraseña">
                Contraseña
              </label>
              <div className="input-group">
                <input
                  autoComplete="current-password"
                  className="form-control"
                  disabled={cargando}
                  id="contraseña"
                  required
                  type={mostrarContraseña ? 'text' : 'password'}
                  value={contraseña}
                  onChange={(evento) => setContraseña(evento.target.value)}
                />
                <button
                  aria-label={
                    mostrarContraseña ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={mostrarContraseña}
                  className="btn btn-outline-secondary"
                  disabled={cargando}
                  type="button"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                >
                  {mostrarContraseña ? (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="20"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="20"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.8 5.2 9.5 6.3a1.3 1.3 0 0 1 0 1.4 18 18 0 0 1-3.2 3.8" />
                      <path d="M6.5 6.5A18 18 0 0 0 2.5 10.3a1.3 1.3 0 0 0 0 1.4C3.2 12.8 6.8 18 12 18c1.1 0 2.1-.2 3.1-.6" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="20"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="20"
                    >
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="alert alert-danger py-2" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary w-100" disabled={cargando} type="submit">
              {cargando ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginForm
