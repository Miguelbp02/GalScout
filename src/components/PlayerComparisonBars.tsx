import { useState } from 'react'
import type { GrupoCriterio, ResumenValoracionCriterio } from '../types/criterio'

interface PlayerComparisonBarsProps {
  nombreA: string
  nombreB: string
  valoracionesA: ResumenValoracionCriterio[]
  valoracionesB: ResumenValoracionCriterio[]
}

interface FilaComparacion {
  id: number
  nombre: string
  grupo: GrupoCriterio
  mediaA: number
  mediaB: number
}

const grupos: GrupoCriterio[] = ['Físico', 'Técnico', 'Táctico', 'Mental']
const ESCALA_MAXIMA = 20

function formatearMedia(media: number) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(media)
}

function PlayerComparisonBars({
  nombreA,
  nombreB,
  valoracionesA,
  valoracionesB,
}: PlayerComparisonBarsProps) {
  const [modoRelativo, setModoRelativo] = useState(false)

  const mediasBPorId = new Map(
    valoracionesB.map((valoracion) => [valoracion.id, valoracion.media]),
  )

  const filas: FilaComparacion[] = valoracionesA.flatMap((valoracion) => {
    const mediaB = mediasBPorId.get(valoracion.id)

    if (mediaB === undefined) return []

    return [
      {
        id: valoracion.id,
        nombre: valoracion.nombre,
        grupo: valoracion.grupo,
        mediaA: valoracion.media,
        mediaB,
      },
    ]
  })

  if (filas.length === 0) {
    return (
      <p className="empty-player-list mb-0 rounded border p-4 text-center text-body-secondary mt-4">
        No hay atributos valorados en común entre los dos jugadores todavía.
      </p>
    )
  }

  const etiquetaAccion = modoRelativo
    ? 'Mostrar valores completos'
    : 'Mostrar solo la diferencia'

  return (
    <div className="mt-4">
      <div className="comparison-bars-header">
        <span className="comparison-bars-header-name comparison-bars-header-name--a">
          {nombreA}
        </span>
        <span className="comparison-bars-header-name comparison-bars-header-name--b">
          {nombreB}
        </span>
        <div className="comparison-bars-toolbar">
          <button
            aria-label={etiquetaAccion}
            aria-pressed={modoRelativo}
            className="comparison-mode-toggle"
            title={etiquetaAccion}
            type="button"
            onClick={() => setModoRelativo((actual) => !actual)}
          >
            <span aria-hidden="true" className="comparison-mode-toggle-track">
              <span className="comparison-mode-toggle-thumb" />
            </span>
            <span className="comparison-mode-toggle-text">
              {modoRelativo ? 'Relativa' : 'Absoluta'}
            </span>
          </button>
        </div>
      </div>

      <div className="d-grid gap-4">
        {grupos.map((grupo) => {
          const filasDelGrupo = filas.filter((fila) => fila.grupo === grupo)

          if (filasDelGrupo.length === 0) return null

          return (
            <section key={grupo}>
              <h3 className="h6 text-uppercase text-body-secondary mb-2">{grupo}</h3>
              <div className="d-grid gap-2">
                {filasDelGrupo.map((fila) => {
                  const mejorA = fila.mediaA > fila.mediaB
                  const mejorB = fila.mediaB > fila.mediaA
                  const diferencia = Math.abs(fila.mediaA - fila.mediaB)

                  const anchoA = modoRelativo
                    ? (mejorA ? diferencia / ESCALA_MAXIMA : 0) * 100
                    : (fila.mediaA / ESCALA_MAXIMA) * 100
                  const anchoB = modoRelativo
                    ? (mejorB ? diferencia / ESCALA_MAXIMA : 0) * 100
                    : (fila.mediaB / ESCALA_MAXIMA) * 100

                  return (
                    <div className="comparison-bar-row" key={fila.id}>
                      <span
                        className={`comparison-bar-value comparison-bar-value--a ${
                          mejorA ? 'comparison-bar-value--mejor' : ''
                        } ${mejorB ? 'comparison-bar-value--peor' : ''}`}
                      >
                        {formatearMedia(fila.mediaA)}
                      </span>
                      <span className="comparison-bar comparison-bar--a">
                        <span
                          className={`comparison-bar-fill comparison-bar-fill--a ${
                            mejorB ? 'comparison-bar-fill--peor' : ''
                          }`}
                          style={{ width: `${anchoA}%` }}
                        />
                      </span>
                      <span className="comparison-bar-label">{fila.nombre}</span>
                      <span className="comparison-bar comparison-bar--b">
                        <span
                          className={`comparison-bar-fill comparison-bar-fill--b ${
                            mejorA ? 'comparison-bar-fill--peor' : ''
                          }`}
                          style={{ width: `${anchoB}%` }}
                        />
                      </span>
                      <span
                        className={`comparison-bar-value comparison-bar-value--b ${
                          mejorB ? 'comparison-bar-value--mejor' : ''
                        } ${mejorA ? 'comparison-bar-value--peor' : ''}`}
                      >
                        {formatearMedia(fila.mediaB)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default PlayerComparisonBars
