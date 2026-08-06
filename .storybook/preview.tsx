import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/styles/tokens.css'
import './preview.css'

/**
 * 툴바에서 고른 테마를 preview 문서 루트에 반영한다.
 * 데코레이터는 React 컴포넌트로 렌더되는 게 아니라 함수로 호출되므로 훅을 쓸 수 없다.
 * `document`를 직접 건드리는 것이 여기서는 올바른 방법이다.
 */
const withTheme: Decorator = (Story, context) => {
  if (context.globals.theme === 'dark') {
    document.documentElement.dataset.theme = 'dark'
  } else {
    delete document.documentElement.dataset.theme
  }
  return <Story />
}

/**
 * parameters.fixedWidth가 있으면 그 폭의 컨테이너로 감싼다.
 * 폭이 가변인 컴포넌트를 검토하기 좋은 크기로 고정하기 위한 것으로, 기본값은 480px이다.
 */
const withFixedWidth: Decorator = (Story, context) => {
  const width = context.parameters.fixedWidth as number | undefined
  if (!width) return <Story />
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withFixedWidth, withTheme],
  globalTypes: {
    theme: {
      description: '라이트 / 다크 테마',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    controls: { expanded: true },
    a11y: { test: 'todo' },
  },
}

export default preview
