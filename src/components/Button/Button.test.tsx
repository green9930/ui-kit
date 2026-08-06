import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
// 토큰/스킴 CSS를 로드해 solid variant의 background-color가 실제 색상값으로 계산되게 한다.
// 없어도 specificity 검증 자체는 성립하지만(미해석 var()는 그냥 다른 값으로 떨어질 뿐),
// 있으면 "내부 규칙이 이겼다면 어떤 값이 나왔을지"가 실제 파란색이 되어 실패 시 더 읽기 쉽다.
import '../../styles/tokens.css'

describe('Button', () => {
  afterEach(() => {
    document.querySelectorAll('style[data-test-consumer-style]').forEach((node) => node.remove())
  })

  // Fix 1 회귀 테스트. 내부 규칙이 `.button[data-variant='solid']`처럼 컴파운드
  // attribute selector로 남아 있으면 specificity가 (0,2,0)이라, 소비자의 단일
  // class((0,1,0))는 로드 순서와 무관하게 항상 진다 — 그래서 실제 계산된 스타일
  // (getComputedStyle)로 검증한다. class 목록에 이름이 들어있는지만 보는 assertion은
  // specificity 버그를 못 잡아 이 회귀를 놓친다.
  //
  // jsdom이 이 캐스케이드를 신뢰성 있게 계산하는지도 별도로 확인했다(스크래치 테스트,
  // 리포트 참조): specificity가 다르면 jsdom도 CSS 스펙대로 더 높은 쪽을 고르고,
  // specificity가 같으면 문서에 나중에 추가된 스타일시트를 고른다 — 둘 다 실제
  // 브라우저와 동일하다. 그래서 이 테스트는 소비자 스타일시트를 Button의 CSS Modules
  // <style>(컴포넌트 import 시점에 이미 head에 들어가 있음)보다 나중에 추가해,
  // "라이브러리를 먼저 import하고 자기 CSS(Tailwind 등)를 그 뒤에 로드하는" 실제
  // 소비 시나리오를 흉내낸다. 고친 CSS에서는 이 순서에서 소비자가 이기고, 고치기 전
  // 버전(컴파운드 selector, `:where()` 없음)으로 되돌리면 순서를 바꿔도 항상 진다 —
  // 직접 두 버전으로 실행해 확인했다.
  it('lets a consumer class win over the internal variant/size rules (Layer 2 — className override)', () => {
    render(<Button className="consumer-override">저장</Button>)
    const button = screen.getByRole('button')

    const consumerStyle = document.createElement('style')
    consumerStyle.setAttribute('data-test-consumer-style', '')
    consumerStyle.textContent = `
      .consumer-override {
        background-color: rgb(255, 0, 0);
        border-radius: 999px;
      }
    `
    document.head.appendChild(consumerStyle)

    const computed = getComputedStyle(button)
    // data-variant='solid' 규칙이 정하는 속성 — 소비자가 이겨야 한다.
    expect(computed.backgroundColor).toBe('rgb(255, 0, 0)')
    // data-size='md' 규칙이 정하는 속성 — 소비자가 이겨야 한다.
    expect(computed.borderRadius).toBe('999px')
  })

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

  it('keeps the child intact and injects the spinner inside it when asChild and isLoading are combined', () => {
    render(
      <Button asChild isLoading colorScheme="secondary">
        <a href="/next">이동</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: '이동' })
    expect(link).toHaveAttribute('data-scheme', 'secondary')
    expect(link).toHaveAttribute('data-variant', 'solid')
    expect(link.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('forwards ref, blocks onClick, and removes from the tab order when asChild and isLoading are combined, without a React warning', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const ref = createRef<HTMLButtonElement>()
    const onClick = vi.fn()
    render(
      <Button asChild isLoading ref={ref} onClick={onClick}>
        <a href="/next">이동</a>
      </Button>,
    )
    const link = screen.getByRole('link')
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
    await user.click(link)
    expect(onClick).not.toHaveBeenCalled()
    expect(link).toHaveAttribute('tabindex', '-1')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('does not fire the consumer onClick on a disabled asChild anchor', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button asChild disabled onClick={onClick}>
        <a href="/next">이동</a>
      </Button>,
    )
    await user.click(screen.getByRole('link'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not fire a handler declared on the child itself when disabled via asChild', async () => {
    const user = userEvent.setup()
    const childOnClick = vi.fn()
    render(
      <Button asChild disabled>
        <a href="/next" onClick={childOnClick}>
          이동
        </a>
      </Button>,
    )
    await user.click(screen.getByRole('link'))
    expect(childOnClick).not.toHaveBeenCalled()
  })

  it('removes a disabled asChild anchor from the tab order', () => {
    render(
      <Button asChild disabled>
        <a href="/next">이동</a>
      </Button>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1')
  })
})
