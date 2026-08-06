import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../src/components/Button'
import {
  applyOverrides,
  clearOverrides,
  readOverrides,
  type TokenOverrides,
} from './tokenControl'

const FONT_OPTIONS = [
  { label: '기본 (시스템)', value: '' },
  { label: 'Pretendard', value: "'Pretendard Variable', Pretendard, sans-serif" },
  { label: 'Georgia (세리프)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Monospace', value: "'SF Mono', Menlo, monospace" },
]

/**
 * 스킴마다 solid 배경으로 쓰는 팔레트 스텝이 다르다. 흰 글자로 4.5:1을 넘기는 지점이
 * 색조별로 다르기 때문으로, warning은 500, success는 700, 나머지는 600을 쓴다.
 * 그래서 여기서도 각 스킴이 실제로 쓰는 스텝을 노출한다 — 전부 600으로 통일하면
 * warning과 success 버튼은 색을 바꿔도 아무 반응이 없다.
 */
const SCHEME_COLORS = [
  { scheme: 'primary', token: '--uikit-color-primary-600', fallback: '#2563eb' },
  { scheme: 'secondary', token: '--uikit-color-secondary-600', fallback: '#7c3aed' },
  { scheme: 'danger', token: '--uikit-color-danger-600', fallback: '#dc2626' },
  { scheme: 'warning', token: '--uikit-color-warning-500', fallback: '#f59e0b' },
  { scheme: 'success', token: '--uikit-color-success-700', fallback: '#15803d' },
] as const

function TokenPlayground() {
  const [overrides, setOverrides] = useState<TokenOverrides>(() => readOverrides())

  useEffect(() => {
    applyOverrides(overrides)
  }, [overrides])

  const set = (name: string, value: string) =>
    setOverrides((prev) => ({ ...prev, [name]: value }))

  const reset = () => {
    clearOverrides()
    setOverrides({})
  }

  const row = {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  } as const

  return (
    <div style={{ display: 'grid', gap: 32, maxWidth: 720 }}>
      <section>
        <h3 style={{ marginTop: 0 }}>토큰 조절</h3>

        {SCHEME_COLORS.map(({ scheme, token, fallback }) => (
          <div style={row} key={scheme}>
            <label htmlFor={`tp-${scheme}`}>{token.replace('--uikit-color-', '')}</label>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id={`tp-${scheme}`}
                type="color"
                value={overrides[token] || fallback}
                onChange={(e) => set(token, e.target.value)}
              />
              <span style={{ color: 'var(--uikit-color-fg-muted)', fontSize: 13 }}>
                {scheme}
              </span>
            </span>
          </div>
        ))}

        <div style={row}>
          <label htmlFor="tp-radius">radius-md</label>
          <span>
            <input
              id="tp-radius"
              type="range"
              min={0}
              max={24}
              value={Number.parseInt(overrides['--uikit-radius-md'] ?? '6', 10)}
              onChange={(e) => set('--uikit-radius-md', `${e.target.value}px`)}
            />{' '}
            {overrides['--uikit-radius-md'] ?? '6px'}
          </span>
        </div>

        <div style={row}>
          <label htmlFor="tp-height">control-height-md</label>
          <span>
            <input
              id="tp-height"
              type="range"
              min={28}
              max={64}
              value={Number.parseInt(overrides['--uikit-control-height-md'] ?? '40', 10)}
              onChange={(e) => set('--uikit-control-height-md', `${e.target.value}px`)}
            />{' '}
            {overrides['--uikit-control-height-md'] ?? '40px'}
          </span>
        </div>

        <div style={row}>
          <label htmlFor="tp-font">font-family</label>
          <select
            id="tp-font"
            value={overrides['--uikit-font-family'] ?? ''}
            onChange={(e) => set('--uikit-font-family', e.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" onClick={reset}>
          전부 되돌리기
        </button>
      </section>

      <section>
        <h3>즉시 반영되는 컴포넌트</h3>
        <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          {(['solid', 'outline', 'ghost'] as const).map((variant) => (
            <div key={variant} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SCHEME_COLORS.map(({ scheme }) => (
                <Button key={scheme} variant={variant} colorScheme={scheme}>
                  {scheme}
                </Button>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
        <p style={{ color: 'var(--uikit-color-fg-muted)', fontSize: 14 }}>
          여기서 바꾼 값은 다른 모든 스토리에도 그대로 적용됩니다. Primitives/Button으로
          이동해 확인해 보세요.
        </p>
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundation/Token Playground',
  component: TokenPlayground,
} satisfies Meta<typeof TokenPlayground>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
