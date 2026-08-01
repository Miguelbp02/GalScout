import { useEffect, useRef, useState } from 'react'

export type Tema = 'light' | 'dark'

const CLAVE_ALMACENAMIENTO = 'galscout-tema'

export function obtenerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO)
  if (guardado === 'light' || guardado === 'dark') return guardado

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(obtenerTemaInicial)
  const temporizadorTransicion = useRef<number | undefined>(undefined)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
    localStorage.setItem(CLAVE_ALMACENAMIENTO, tema)
  }, [tema])

  useEffect(() => {
    return () => window.clearTimeout(temporizadorTransicion.current)
  }, [])

  const alternarTema = () => {
    document.documentElement.classList.add('theme-transition')
    window.clearTimeout(temporizadorTransicion.current)
    setTema((actual) => (actual === 'light' ? 'dark' : 'light'))
    temporizadorTransicion.current = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 360)
  }

  return { tema, alternarTema }
}
