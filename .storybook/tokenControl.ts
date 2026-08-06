const STORAGE_KEY = 'uikit-token-overrides'

export interface TokenOverrides {
  [cssVariable: string]: string
}

export function readOverrides(): TokenOverrides {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as TokenOverrides
  } catch {
    return {}
  }
}

export function applyOverrides(overrides: TokenOverrides): void {
  const root = document.documentElement
  for (const [name, value] of Object.entries(overrides)) {
    if (value) root.style.setProperty(name, value)
    else root.style.removeProperty(name)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function clearOverrides(): void {
  const root = document.documentElement
  for (const name of Object.keys(readOverrides())) {
    root.style.removeProperty(name)
  }
  localStorage.removeItem(STORAGE_KEY)
}
