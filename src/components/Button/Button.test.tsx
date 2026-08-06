import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('defaults to solid / md / primary', () => {
    render(<Button>저장</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-scheme', 'primary')
    expect(button).toHaveAttribute('data-variant', 'solid')
    expect(button).toHaveAttribute('data-size', 'md')
  })

  it('reflects variant, size, and colorScheme in data attributes', () => {
    render(
      <Button variant="outline" size="lg" colorScheme="danger">
        삭제
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-variant', 'outline')
    expect(button).toHaveAttribute('data-size', 'lg')
    expect(button).toHaveAttribute('data-scheme', 'danger')
  })

  it('defaults type to "button" so it does not submit forms accidentally', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('honours an explicit type', () => {
    render(<Button type="submit">저장</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>저장</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is disabled and marked busy while loading', () => {
    render(<Button isLoading>저장</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps its label readable while loading', () => {
    render(<Button isLoading>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('merges className after its own classes', () => {
    render(<Button className="extra">저장</Button>)
    expect(screen.getByRole('button').className).toMatch(/\bextra$/)
  })

  it('forwards ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>저장</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('spreads native props', () => {
    render(<Button data-testid="save" aria-describedby="hint">저장</Button>)
    const button = screen.getByTestId('save')
    expect(button).toHaveAttribute('aria-describedby', 'hint')
  })

  it('renders the child element when asChild is set', () => {
    render(
      <Button asChild colorScheme="secondary">
        <a href="/next">이동</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: '이동' })
    expect(link).toHaveAttribute('href', '/next')
    expect(link).toHaveAttribute('data-scheme', 'secondary')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not force type="button" onto an asChild anchor', () => {
    render(
      <Button asChild>
        <a href="/next">이동</a>
      </Button>,
    )
    expect(screen.getByRole('link')).not.toHaveAttribute('type')
  })

  it('marks fullWidth with a data attribute', () => {
    render(<Button fullWidth>저장</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-full-width', 'true')
  })
})
