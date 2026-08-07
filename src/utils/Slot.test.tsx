import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Slot } from './Slot'

describe('Slot', () => {
  it('renders the child element instead of a wrapper', () => {
    const { container } = render(
      <Slot data-testid="slot">
        <a href="/x">이동</a>
      </Slot>,
    )
    expect(container.firstElementChild?.tagName).toBe('A')
  })

  it('merges className with the slot value first', () => {
    render(
      <Slot className="slot-class">
        <button className="child-class">확인</button>
      </Slot>,
    )
    expect(screen.getByRole('button')).toHaveClass('slot-class', 'child-class')
  })

  it('lets child style keys override slot style keys', () => {
    render(
      <Slot style={{ color: 'red', margin: '4px' }}>
        <button style={{ color: 'blue' }}>확인</button>
      </Slot>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ color: 'rgb(0, 0, 255)', margin: '4px' })
  })

  it('calls both the child handler and the slot handler', async () => {
    const user = userEvent.setup()
    const calls: string[] = []
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button onClick={() => calls.push('child')}>확인</button>
      </Slot>,
    )
    await user.click(screen.getByRole('button'))
    expect(calls).toEqual(['child', 'slot'])
  })

  it('lets non-handler child props win', () => {
    render(
      <Slot type="button" aria-label="slot-label">
        <button aria-label="child-label">확인</button>
      </Slot>,
    )
    const button = screen.getByRole('button', { name: 'child-label' })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('sets both the slot ref and the child ref', () => {
    const slotRef = createRef<HTMLButtonElement>()
    const childRef = createRef<HTMLButtonElement>()
    render(
      <Slot ref={slotRef}>
        <button ref={childRef}>확인</button>
      </Slot>,
    )
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(slotRef.current).toBe(childRef.current)
  })

  it('calls a function ref for the child', () => {
    const fnRef = vi.fn()
    render(
      <Slot>
        <button ref={fnRef}>확인</button>
      </Slot>,
    )
    expect(fnRef).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('runs a returned ref cleanup on unmount and still nulls out a sibling ref', () => {
    const cleanup = vi.fn()
    const childRef = (node: HTMLButtonElement | null) => {
      if (node) return cleanup
    }
    const slotRef = createRef<HTMLButtonElement>()
    const { unmount } = render(
      <Slot ref={slotRef}>
        <button ref={childRef}>확인</button>
      </Slot>,
    )
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement)

    unmount()

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(slotRef.current).toBeNull()
  })

  it('returns null when the child is not a valid element', () => {
    const { container } = render(<Slot>그냥 문자열</Slot>)
    expect(container).toBeEmptyDOMElement()
  })
})
