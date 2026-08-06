import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins truthy string values with a single space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it('drops false, null, undefined, and empty strings', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cx(false, null, undefined)).toBe('')
  })

  it('supports conditional expressions', () => {
    const isActive = true
    const isDisabled = false
    expect(cx('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active',
    )
  })
})
