import type { CriterioScouting, GrupoCriterio } from '../types/criterio'

interface CriteriaRatingsInputProps {
  criterios: CriterioScouting[]
  cargando: boolean
  error: string | null
  puntuaciones: Record<number, string>
  disabled?: boolean
  onCambiarPuntuacion: (criterioId: number, valor: string) => void
}

const grupos: GrupoCriterio[] = ['Físico', 'Técnico', 'Táctico', 'Mental']

function CriteriaRatingsInput({
  criterios,
  cargando,
  error,
  puntuaciones,
  disabled = false,
  onCambiarPuntuacion,
}: CriteriaRatingsInputProps) {
  return (
    <details className="observation-ratings mb-4">
      <summary className="fw-semibold">Valoraciones opcionales (de 0 a 20)</summary>
      <p className="small text-body-secondary mt-2 mb-3">
        Rellena únicamente los atributos que hayas podido valorar con criterio en este
        informe.
      </p>

      {cargando && <p className="small text-body-secondary">Cargando criterios…</p>}

      {error && (
        <p className="alert alert-warning py-2 small" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && (
        <div className="d-grid gap-2">
          {grupos.map((grupo) => {
            const criteriosDelGrupo = criterios.filter(
              (criterio) => criterio.grupo === grupo,
            )

            return (
              <details className="criteria-group" key={grupo}>
                <summary className="fw-semibold">
                  {grupo} ({criteriosDelGrupo.length})
                </summary>
                <div className="pt-3">
                  <div className="row g-3">
                    {criteriosDelGrupo.map((criterio) => {
                      const idInput = `criterio-${criterio.id}`

                      return (
                        <div className="col-12 col-sm-6" key={criterio.id}>
                          <label className="form-label small" htmlFor={idInput}>
                            {criterio.nombre}
                          </label>
                          <input
                            className="form-control"
                            disabled={disabled}
                            id={idInput}
                            inputMode="numeric"
                            max={20}
                            min={0}
                            placeholder="Sin valorar"
                            step={1}
                            type="number"
                            value={puntuaciones[criterio.id] ?? ''}
                            onChange={(evento) =>
                              onCambiarPuntuacion(criterio.id, evento.target.value)
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </details>
  )
}

export default CriteriaRatingsInput
