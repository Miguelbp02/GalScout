import { useEffect, useMemo, useState } from 'react'
import { obtenerEtiquetasAccion } from '../services/actionTagService'
import { filtrarAccionesDeJuego } from '../services/playerStatsService'
import type {
  AccionObservacionDePartido,
  CategoriaEtiquetaAccion,
  EtiquetaAccion,
} from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'

export interface EtiquetaVisible {
  nombre: string
  categoria: CategoriaEtiquetaAccion
  orden: number
  total: number
  /** Etiqueta retirada del catálogo que todavía aparece en informes antiguos. */
  obsoleta: boolean
}

// Las etiquetas retiradas del catálogo van al final, después de cualquier
// etiqueta vigente, pero antes que las de sustitución (orden 100 en adelante
// no llega hasta aquí porque esas se filtran).
const ORDEN_OBSOLETAS = 900

/**
 * Reúne las etiquetas que hay que ofrecer como filtro y decide cuáles se ven.
 *
 * La lista no puede salir solo del catálogo activo: hay etiquetas que se
 * desactivaron en su día pero que siguen existiendo en informes ya guardados
 * (por ejemplo «Cambio de orientación exitoso»). Si solo miráramos el catálogo,
 * esas acciones quedarían contadas en los totales pero invisibles en el mapa y
 * sin ninguna forma de mostrarlas. Por eso se toma la unión del catálogo con lo
 * que de verdad aparece en las acciones cargadas.
 *
 * El estado guarda las etiquetas OCULTAS, no las visibles: así, cualquier
 * etiqueta que aparezca más tarde (porque cambie la selección de partidos o
 * porque el catálogo termine de cargar) se ve por defecto en lugar de quedarse
 * fuera sin que nadie se entere.
 */
export function useFiltroEtiquetas(
  perfil: PerfilScouting,
  acciones: AccionObservacionDePartido[],
) {
  const [catalogo, setCatalogo] = useState<EtiquetaAccion[]>([])
  const [ocultas, setOcultas] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelado = false

    obtenerEtiquetasAccion(perfil)
      .then((datos) => {
        if (cancelado) return
        setCatalogo(datos.filter((etiqueta) => !etiqueta.esSustitucion))
      })
      .catch(() => {
        if (!cancelado) setCatalogo([])
      })

    return () => {
      cancelado = true
    }
  }, [perfil])

  const etiquetas = useMemo(() => {
    const porNombre = new Map<string, EtiquetaVisible>()

    for (const etiqueta of catalogo) {
      porNombre.set(etiqueta.nombre, {
        nombre: etiqueta.nombre,
        categoria: etiqueta.categoria,
        orden: etiqueta.orden,
        total: 0,
        obsoleta: false,
      })
    }

    for (const accion of filtrarAccionesDeJuego(acciones)) {
      const existente = porNombre.get(accion.etiquetaNombre)
      if (existente) {
        existente.total += 1
      } else {
        porNombre.set(accion.etiquetaNombre, {
          nombre: accion.etiquetaNombre,
          categoria: accion.categoria,
          orden: ORDEN_OBSOLETAS,
          total: 1,
          obsoleta: true,
        })
      }
    }

    return [...porNombre.values()].sort((a, b) => a.orden - b.orden)
  }, [catalogo, acciones])

  const positivas = etiquetas.filter((etiqueta) => etiqueta.categoria === 'positiva')
  const negativas = etiquetas.filter((etiqueta) => etiqueta.categoria === 'negativa')

  function alternarEtiqueta(nombre: string) {
    setOcultas((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(nombre)) nuevo.delete(nombre)
      else nuevo.add(nombre)
      return nuevo
    })
  }

  function alternarGrupo(lista: EtiquetaVisible[], mostrar: boolean) {
    setOcultas((actual) => {
      const nuevo = new Set(actual)
      lista.forEach((etiqueta) => {
        if (mostrar) nuevo.delete(etiqueta.nombre)
        else nuevo.add(etiqueta.nombre)
      })
      return nuevo
    })
  }

  const accionesVisibles = useMemo(
    () =>
      filtrarAccionesDeJuego(acciones).filter((accion) => !ocultas.has(accion.etiquetaNombre)),
    [acciones, ocultas],
  )

  // Un grupo se considera activo cuando alguna de sus etiquetas CON DATOS está
  // visible: las etiquetas a cero no deben decidir el estado del interruptor.
  function grupoActivo(lista: EtiquetaVisible[]) {
    const conDatos = lista.filter((etiqueta) => etiqueta.total > 0)
    const relevantes = conDatos.length > 0 ? conDatos : lista
    return relevantes.length > 0 && relevantes.some((etiqueta) => !ocultas.has(etiqueta.nombre))
  }

  return {
    etiquetas,
    positivas,
    negativas,
    ocultas,
    alternarEtiqueta,
    alternarGrupo,
    grupoActivo,
    accionesVisibles,
  }
}
