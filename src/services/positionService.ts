import { supabase } from '../lib/supabase'
import type { Posicion } from '../types/posicion'

interface PosicionFila {
  id: number
  codigo: string
  nombre: string
  grupo: Posicion['grupo']
  orden: number
}

interface PosicionJugadorFila {
  posicion_id: number
  tipo: 'natural' | 'apta'
}

export interface PerfilPosicionalJugador {
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
}

export async function obtenerPosiciones(): Promise<Posicion[]> {
  const { data, error } = await supabase
    .from('posiciones')
    .select('id, codigo, nombre, grupo, orden')
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as PosicionFila[]
}

export async function obtenerPerfilPosicionalJugador(
  jugadorId: string,
): Promise<PerfilPosicionalJugador> {
  const { data, error } = await supabase
    .from('jugadores_posiciones')
    .select('posicion_id, tipo')
    .eq('jugador_id', jugadorId)

  if (error) {
    throw new Error(error.message)
  }

  const posiciones = data as PosicionJugadorFila[]

  return {
    posicionesNaturalesIds: posiciones
      .filter((posicion) => posicion.tipo === 'natural')
      .map((posicion) => posicion.posicion_id),
    posicionesAptasIds: posiciones
      .filter((posicion) => posicion.tipo === 'apta')
      .map((posicion) => posicion.posicion_id),
  }
}
