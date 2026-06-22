import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'horarios-fib-theme'

/**
 * Hook de tema reactivo.
 * - Arranca en claro (estilo FIB) salvo que el usuario haya guardado otra preferencia.
 *
 * @returns {{ tema: 'dark' | 'light', alternarTema: () => void }}
 */
export function useTheme() {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem(STORAGE_KEY)
    return guardado === 'light' || guardado === 'dark' ? guardado : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem(STORAGE_KEY, tema)
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { tema, alternarTema }
}
