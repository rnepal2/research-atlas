import { useCallback, useLayoutEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'research-atlas-folio-theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* Keep the selected theme for this session. */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return {
    theme,
    toggleTheme,
  }
}
