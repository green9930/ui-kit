import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['solid', 'outline', 'ghost', 'link'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    colorScheme: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'danger', 'warning', 'success'],
    },
  },
  args: { children: '저장하기' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button {...args} variant="solid">Solid</Button>
      <Button {...args} variant="outline">Outline</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="link">Link</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
}

export const ColorSchemes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['primary', 'secondary', 'danger', 'warning', 'success'] as const).map(
            (scheme) => (
              <Button key={scheme} {...args} variant={variant} colorScheme={scheme}>
                {scheme}
              </Button>
            ),
          )}
        </div>
      ))}
    </div>
  ),
}

/** default / hover / focus / disabled / loading 을 한 화면에서 비교한다 */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button {...args}>Default</Button>
      <Button {...args} disabled>Disabled</Button>
      <Button {...args} isLoading>Loading</Button>
      <Button {...args} autoFocus>Focused</Button>
    </div>
  ),
}

export const WithIcon: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1.5 10 6l4.5.4-3.4 3 1 4.4L8 11.5 3.9 13.8l1-4.4-3.4-3L6 6z" />
          </svg>
          아이콘
        </Button>
      ))}
    </div>
  ),
}

/** 폭이 가변인 케이스는 480px 컨테이너 안에서 검토한다 */
export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: { fixedWidth: 480 },
}

export const AsChild: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="https://example.com" target="_blank" rel="noreferrer">
        링크로 렌더링
      </a>
    </Button>
  ),
}
