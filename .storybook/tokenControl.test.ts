import { afterEach, describe, expect, it } from 'vitest'
import { applyOverrides, clearOverrides, hydrateOverrides, readOverrides } from './tokenControl'

const STORAGE_KEY = 'uikit-token-overrides'

describe('tokenControl', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    document.documentElement.removeAttribute('style')
  })

  it('returns the stored overrides when the shape is correct', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '--uikit-radius-md': '12px' }))
    expect(readOverrides()).toEqual({ '--uikit-radius-md': '12px' })
  })

  it('falls back to {} on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(readOverrides()).toEqual({})
  })

  // Task 7 이후 hydrateOverrides()는 모든 스토리 렌더 전에 데코레이터에서 호출된다.
  // 유효한 JSON이지만 기대한 { [cssVariable]: string } 형태가 아니면(null, 배열,
  // 원시값) Object.entries()가 던져서 Storybook 전체가 하얗게 죽는다 — 플레이그라운드
  // 하나만이 아니라 모든 스토리가. 저장된 값이 오염됐을 뿐인데 전체가 죽는 게 버그다.
  it.each([['null', 'null'], ['array', '[1,2]'], ['number', '42'], ['string', '"oops"']])(
    'does not throw when localStorage holds valid JSON that is not an override map (%s)',
    (_label, stored) => {
      localStorage.setItem(STORAGE_KEY, stored)
      expect(readOverrides()).toEqual({})
      expect(() => hydrateOverrides()).not.toThrow()
    },
  )

  it('clearOverrides tolerates a corrupted stored value', () => {
    localStorage.setItem(STORAGE_KEY, '[1,2]')
    expect(() => clearOverrides()).not.toThrow()
  })

  it('round-trips valid overrides through apply/hydrate', () => {
    applyOverrides({ '--uikit-radius-md': '10px' })
    document.documentElement.removeAttribute('style')
    hydrateOverrides()
    expect(document.documentElement.style.getPropertyValue('--uikit-radius-md')).toBe('10px')
  })
})
