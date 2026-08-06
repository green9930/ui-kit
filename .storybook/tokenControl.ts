const STORAGE_KEY = 'uikit-token-overrides'

export interface TokenOverrides {
  [cssVariable: string]: string
}

/** JSON.parse가 성공해도 `null`, 배열, 문자열/숫자 등 객체가 아닌 값일 수 있다 —
 *  그런 값을 그대로 반환하면 호출부의 `Object.entries()`가 던진다. */
function isTokenOverrides(value: unknown): value is TokenOverrides {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readOverrides(): TokenOverrides {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown
    return isTokenOverrides(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** overrides를 document.documentElement에 쓰기만 한다. localStorage는 건드리지 않는다. */
function writeOverrides(overrides: TokenOverrides): void {
  const root = document.documentElement
  for (const [name, value] of Object.entries(overrides)) {
    if (value) root.style.setProperty(name, value)
    else root.style.removeProperty(name)
  }
}

export function applyOverrides(overrides: TokenOverrides): void {
  writeOverrides(overrides)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

/**
 * localStorage에 저장된 오버라이드를 현재 문서에 반영한다. 다시 persist하지는 않는다 —
 * 방금 저장소에서 읽은 값을 그대로 다시 쓰는 것은 의미가 없다.
 * 데코레이터가 매 스토리 렌더마다 호출해서, 새로고침으로 문서가 새로 만들어져도
 * TokenPlayground를 다시 거치지 않고 이전 오버라이드가 즉시 재적용되게 한다.
 */
export function hydrateOverrides(): void {
  writeOverrides(readOverrides())
}

export function clearOverrides(): void {
  const root = document.documentElement
  for (const name of Object.keys(readOverrides())) {
    root.style.removeProperty(name)
  }
  localStorage.removeItem(STORAGE_KEY)
}
