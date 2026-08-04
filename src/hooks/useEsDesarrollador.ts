import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CORREOS_DESARROLLADORES } from '../constants/desarrolladores'

const correosDesarrolladoresNormalizados = CORREOS_DESARROLLADORES.map((correo) =>
  correo.toLocaleLowerCase('es-ES'),
)

function esCorreoDeDesarrollador(email: string | null | undefined) {
  return Boolean(
    email && correosDesarrolladoresNormalizados.includes(email.toLocaleLowerCase('es-ES')),
  )
}

export function useEsDesarrollador() {
  const [esDesarrollador, setEsDesarrollador] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEsDesarrollador(esCorreoDeDesarrollador(session?.user.email))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setEsDesarrollador(esCorreoDeDesarrollador(session?.user.email))
    })

    return () => subscription.unsubscribe()
  }, [])

  return esDesarrollador
}
