const TEMPORADAS_HACIA_ATRAS = 4
const MES_INICIO_TEMPORADA = 6 // julio (0-indexado): a partir de aquí se considera pretemporada de la siguiente

function obtenerAñoInicioTemporadaActual(fecha: Date): number {
  return fecha.getMonth() >= MES_INICIO_TEMPORADA
    ? fecha.getFullYear()
    : fecha.getFullYear() - 1
}

export function obtenerTemporadasRecientes(fecha: Date = new Date()): string[] {
  const añoInicio = obtenerAñoInicioTemporadaActual(fecha)

  return Array.from({ length: TEMPORADAS_HACIA_ATRAS }, (_, indice) => {
    const inicio = añoInicio - indice
    const finCorto = String((inicio + 1) % 100).padStart(2, '0')
    return `${inicio}/${finCorto}`
  })
}
