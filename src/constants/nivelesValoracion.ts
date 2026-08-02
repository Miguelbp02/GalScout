/**
 * Escala de color de las valoraciones (0-20). Es el lenguaje cromático común de
 * la app: la usan las medias por criterio, las valoraciones generales y la
 * consistencia partido a partido, así que vive aquí para que los umbrales no se
 * puedan desincronizar entre pantallas.
 */
export function obtenerClaseNivel(puntuacion: number) {
  if (puntuacion < 5) return 'rating-level-red'
  if (puntuacion < 8) return 'rating-level-orange'
  if (puntuacion < 12) return 'rating-level-yellow'
  if (puntuacion < 15) return 'rating-level-lime'

  return 'rating-level-green'
}
