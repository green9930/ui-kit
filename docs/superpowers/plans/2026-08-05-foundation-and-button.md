# Foundation + Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@green9930/ui-kit`의 Foundation(디자인 토큰, 빌드 파이프라인, `Slot`/`cx` 유틸, Storybook 쇼케이스)을 구축하고, 이 기반이 실제로 동작하는지 검증하기 위해 Button 한 개를 완성한다.

**Architecture:** CSS Modules와 CSS 커스텀 프로퍼티로 스타일을 구성한다. 컴포넌트 CSS는 팔레트를 직접 참조하지 않고 `data-scheme` 속성이 주입하는 스킴 슬롯만 참조하므로, `colorScheme` prop 하나로 색상 계열 전체가 교체된다. Vite library mode가 컴포넌트별 진입점을 만들고 `vite-plugin-lib-inject-css`가 각 JS에 자기 CSS import를 심어, 소비자는 CSS를 별도로 import하지 않으면서도 안 쓴 컴포넌트는 CSS까지 트리셰이킹된다.

**Tech Stack:** React 18+ (peer), TypeScript, Vite (library mode), CSS Modules, PostCSS (`@csstools/postcss-global-data` + `postcss-custom-media`), Vitest + Testing Library + jsdom, Storybook (`@storybook/react-vite`), pnpm

## Global Constraints

- 패키지명 `@green9930/ui-kit`. npm 스코프 배포 시 `--access public` 필요.
- 런타임 의존성 0. `react`, `react-dom`, `react/jsx-runtime`는 external + peerDependencies (`>=18`).
- 개발은 pnpm으로만 한다. `package.json`에 `"packageManager": "pnpm@9.2.0"`.
- 출력 포맷은 ESM 단독. `"type": "module"`, `"sideEffects": ["*.css"]`.
- **컴포넌트 CSS에 하드코딩된 값을 쓰지 않는다.** 색상·간격·radius·폰트·그림자·transition은 전부 `--uikit-` 토큰을 참조한다. 유일한 예외는 `outline-width: 2px`, `outline-offset: 2px`, 스피너 `border-width: 2px`처럼 토큰화 가치가 없는 1~2px 상수다.
- 컴포넌트는 팔레트 변수(`--uikit-color-primary-600`)를 직접 참조하지 않는다. 반드시 시맨틱 별칭(`--uikit-color-fg`)이나 스킴 슬롯(`--uikit-scheme-solid-bg`)을 쓴다.
- 모든 컴포넌트는 `forwardRef`를 쓰고 네이티브 props를 `...rest`로 스프레드한다.
- 렌더 엘리먼트 교체는 `asChild`로만 한다. `as` prop은 만들지 않는다.
- 포커스 표시는 `:focus-visible`을 쓴다. `outline: none`으로 제거하지 않는다.
- `font-family` 선언만 `:where()`로 감싸 specificity를 0으로 낮춘다. `font-size`에는 적용하지 않는다.
- git 커밋은 이 저장소의 로컬 config(`green9930`)로 이뤄진다. 전역 config를 수정하지 않는다.

## File Structure

| 파일 | 책임 |
|---|---|
| `package.json` | 패키지 메타, exports, 스크립트, peer/dev 의존성 |
| `tsconfig.json` / `tsconfig.node.json` | TS 설정 (앱용 / 빌드 도구용) |
| `vite.config.ts` | library mode 다중 진입점, dts, lib-inject-css, Vitest 설정 |
| `postcss.config.js` | global-data → custom-media 순서로 breakpoint 해석 |
| `.npmrc` | pnpm `auto-install-peers` |
| `src/styles/palette.css` | 6개 스킴 × 50~900 원시 팔레트 |
| `src/styles/semantic.css` | 시맨틱 별칭 + `[data-theme="dark"]` 재정의 |
| `src/styles/schemes.css` | `[data-scheme]`별 슬롯 주입 |
| `src/styles/media.css` | `@custom-media` breakpoint 선언 (PostCSS 전역 데이터) |
| `src/styles/tokens.css` | 간격·타이포·컨트롤높이·radius·shadow·z·motion + 위 3개 import |
| `src/styles/reset.css` | 컴포넌트 한정 최소 리셋 |
| `src/utils/cx.ts` | 클래스명 결합 |
| `src/utils/Slot.tsx` | `asChild` 구현 (props 병합, ref 합성, 핸들러 체이닝) |
| `src/types.ts` | `Size`, `ColorScheme`, `Variant` 공통 타입 |
| `src/components/Button/*` | Button 구현·스타일·테스트·스토리·배럴 |
| `src/index.ts` | 공개 API 배럴 + `tokens.css` 부작용 import |
| `.storybook/main.ts` | Storybook 설정 |
| `.storybook/preview.tsx` | 테마 툴바, 480px 데코레이터, 전역 스타일 로드 |
| `.storybook/Foundation.mdx` | 토큰 시각화 Docs 페이지 |
| `.storybook/TokenPlayground.stories.tsx` | 토큰 라이브 조절 + 즉시 반영 확인 |

---

### Task 1: 프로젝트 스캐폴딩과 빌드 파이프라인

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `postcss.config.js`, `.npmrc`, `src/index.ts`, `src/types.ts`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `pnpm build`가 `dist/index.js`와 `dist/index.d.ts`를 생성한다. `src/types.ts`가 `Size = 'sm' | 'md' | 'lg'`, `ColorScheme = 'primary' | 'secondary' | 'danger' | 'warning' | 'success'`, `Variant = 'solid' | 'outline' | 'ghost' | 'link'`를 export한다.

- [ ] **Step 1: pnpm 프로젝트 초기화와 의존성 설치**

작업 디렉토리는 `/Users/geuna/Desktop/playground/ui-kit`이며 이미 git 저장소로 초기화되어 있다.

```bash
printf 'auto-install-peers=true\n' > .npmrc
pnpm init
pnpm add -D react react-dom @types/react @types/react-dom \
  typescript vite @vitejs/plugin-react \
  vite-plugin-dts vite-plugin-lib-inject-css glob \
  postcss @csstools/postcss-global-data postcss-custom-media
```

`react`와 `react-dom`은 devDependency로도 설치한다. 개발·테스트·Storybook에서 실제로 실행해야 하기 때문이다. 배포 시에는 peerDependencies 선언만 소비자에게 전달된다.

- [ ] **Step 2: `package.json` 작성**

`pnpm init`이 만든 내용을 아래로 교체한다. `devDependencies`와 `dependencies` 블록은 Step 1이 기록한 실제 버전을 그대로 유지한다.

```json
{
  "name": "@green9930/ui-kit",
  "version": "0.0.0",
  "description": "React UI component kit",
  "license": "MIT",
  "type": "module",
  "sideEffects": ["*.css"],
  "packageManager": "pnpm@9.2.0",
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

- [ ] **Step 3: TypeScript 설정 작성**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", ".storybook"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

테스트는 `describe`/`it`/`expect`를 `vitest`에서 명시적으로 import하므로 `types: ["vitest/globals"]`를 넣지 않는다. 넣으면 vitest가 아직 설치되지 않은 이 시점의 `tsc --noEmit`이 실패한다.

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

CSS 타입 선언이 필요하다. `src/css.d.ts`를 만든다:

```ts
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.css'
```

`*.module.css`만 선언하면 `src/index.ts`의 `import './styles/tokens.css'`에서 `tsc`가 "Cannot find module"로 실패한다. 부작용 import용 일반 CSS 선언이 함께 필요하다.

- [ ] **Step 4: PostCSS 설정 작성**

`postcss.config.js`:

```js
import globalData from '@csstools/postcss-global-data'
import customMedia from 'postcss-custom-media'

export default {
  plugins: [
    globalData({ files: ['./src/styles/media.css'] }),
    customMedia(),
  ],
}
```

플러그인 순서가 중요하다. `global-data`가 `media.css`의 `@custom-media` 선언을 각 CSS 파일에 주입한 뒤에야 `custom-media`가 해석할 수 있다. 순서를 바꾸면 `@media (--uikit-md)`가 해석되지 않고 그대로 남아 브라우저가 무시한다.

- [ ] **Step 5: Vite 설정 작성**

`vite.config.ts`:

```ts
import { extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { globSync } from 'glob'

const entries = Object.fromEntries(
  globSync('src/**/*.{ts,tsx}', {
    ignore: ['src/**/*.test.*', 'src/**/*.stories.*', 'src/**/*.d.ts'],
  })
    .map((file) => [
      relative('src', file.slice(0, file.length - extname(file).length)),
      fileURLToPath(new URL(file, import.meta.url)),
    ]),
)

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.*', 'src/**/*.stories.*'],
    }),
  ],
  build: {
    lib: {
      entry: resolve('src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      input: entries,
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
```

`preserveModules` 대신 glob 다중 진입점을 쓴다. `vite-plugin-lib-inject-css`가 권장하는 방식으로, 각 진입점이 자기 CSS만 import하게 되어 트리셰이킹이 정확해진다.

- [ ] **Step 6: 공통 타입과 진입점 작성**

`src/types.ts`:

```ts
export type Size = 'sm' | 'md' | 'lg'

export type ColorScheme =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'

export type Variant = 'solid' | 'outline' | 'ghost' | 'link'
```

`src/index.ts`:

```ts
import './styles/tokens.css'

export type { Size, ColorScheme, Variant } from './types'
```

`tokens.css`는 아직 없다. Task 4에서 만들기 전까지 빌드가 실패하므로, 이 태스크에서는 임시로 빈 파일을 만들어 둔다.

```bash
mkdir -p src/styles
touch src/styles/tokens.css
```

- [ ] **Step 7: 빌드 실행으로 파이프라인 검증**

Run: `pnpm build`

Expected: 성공.

```bash
ls dist
```

Expected: 최소한 `index.js`와 `index.d.ts`가 보인다. `types.ts`는 타입만 담고 있어 런타임 코드가 비므로 `types.js`가 나오지 않을 수 있다. 정상이다.

- [ ] **Step 8: `.gitignore` 보강 후 커밋**

`.gitignore`에 아래 항목이 모두 있는지 확인하고 없으면 추가한다.

```
node_modules
dist
storybook-static
.DS_Store
*.local
coverage
*.tsbuildinfo
```

```bash
git add -A
git commit -m "chore: scaffold vite library build pipeline"
```

---

### Task 2: Vitest 세팅과 `cx` 유틸

**Files:**
- Modify: `vite.config.ts`, `package.json`
- Create: `src/utils/cx.ts`, `src/utils/cx.test.ts`, `vitest.setup.ts`

**Interfaces:**
- Consumes: Task 1의 `vite.config.ts`
- Produces: `cx(...values: ClassValue[]): string` — falsy 값을 걸러내고 공백으로 join한다. `ClassValue = string | number | false | null | undefined`. Task 3과 Task 5가 사용한다.

- [ ] **Step 1: 테스트 의존성 설치**

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Vitest 설정 추가**

`vite.config.ts`의 `import` 블록 맨 위에 추가한다:

```ts
/// <reference types="vitest/config" />
```

그리고 `defineConfig({ ... })` 객체에 `build` 다음 형제로 `test` 키를 추가한다:

```ts
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
```

`css: true`가 필요하다. 이게 없으면 테스트에서 CSS Modules import가 빈 객체를 반환해 `styles.button`이 `undefined`가 되고, 클래스 적용을 검증하는 테스트가 전부 실패한다.

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: 실패하는 테스트 작성**

`src/utils/cx.test.ts`:

```ts
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
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm test`

Expected: FAIL — `Failed to resolve import "./cx"`

- [ ] **Step 5: 최소 구현 작성**

`src/utils/cx.ts`:

```ts
export type ClassValue = string | number | false | null | undefined

export function cx(...values: ClassValue[]): string {
  let result = ''
  for (const value of values) {
    if (!value) continue
    result = result ? `${result} ${value}` : String(value)
  }
  return result
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm test`

Expected: PASS — 4 tests

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add cx class name utility with vitest setup"
```

---

### Task 3: `Slot` — `asChild` 구현

**Files:**
- Create: `src/utils/Slot.tsx`, `src/utils/Slot.test.tsx`

**Interfaces:**
- Consumes: `cx` from `src/utils/cx.ts` (Task 2)
- Produces: `Slot` — `forwardRef<HTMLElement, SlotProps>` 컴포넌트. 단일 React 엘리먼트 자식을 받아 자신의 props를 병합해 `cloneElement`한다. Task 5의 Button이 `asChild`일 때 렌더 대상으로 쓴다.

**동작 규약** (테스트가 이 규약을 그대로 검증한다):
- `className`: Slot의 것 뒤에 자식의 것을 이어붙인다
- `style`: 자식 값이 같은 키를 덮어쓴다
- `on*` 핸들러: 자식 → Slot 순으로 **둘 다** 호출한다
- 그 외 props: 자식 값이 우선한다
- `ref`: Slot의 ref와 자식의 ref를 모두 설정한다
- 자식이 유효한 엘리먼트가 아니면 `null`을 반환한다

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/Slot.test.tsx`:

```tsx
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

  it('returns null when the child is not a valid element', () => {
    const { container } = render(<Slot>그냥 문자열</Slot>)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/utils/Slot.test.tsx`

Expected: FAIL — `Failed to resolve import "./Slot"`

- [ ] **Step 3: 구현 작성**

`src/utils/Slot.tsx`:

```tsx
import {
  cloneElement,
  forwardRef,
  isValidElement,
  version,
  type CSSProperties,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from './cx'

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

type AnyProps = Record<string, unknown>

function setRef<T>(ref: Ref<T> | undefined, value: T): void {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ;(ref as MutableRefObject<T | null>).current = value
  }
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) setRef(ref, node)
  }
}

/**
 * React 19는 ref를 props에 담고, React 18은 엘리먼트에 직접 담는다.
 * 19에서 element.ref에 접근하면 deprecation 경고가 나므로 버전으로 분기한다.
 */
function getElementRef(element: ReactElement): Ref<unknown> | undefined {
  const major = Number.parseInt(version.split('.')[0] ?? '18', 10)
  if (major >= 19) {
    return (element.props as { ref?: Ref<unknown> }).ref
  }
  return (element as unknown as { ref?: Ref<unknown> }).ref
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps }

  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key]
    const childValue = childProps[key]

    if (/^on[A-Z]/.test(key)) {
      if (typeof slotValue === 'function' && typeof childValue === 'function') {
        merged[key] = (...args: unknown[]) => {
          ;(childValue as (...a: unknown[]) => void)(...args)
          ;(slotValue as (...a: unknown[]) => void)(...args)
        }
      } else {
        merged[key] = childValue ?? slotValue
      }
      continue
    }

    if (key === 'className') {
      merged[key] = cx(slotValue as string, childValue as string)
      continue
    }

    if (key === 'style') {
      merged[key] = {
        ...(slotValue as CSSProperties),
        ...(childValue as CSSProperties),
      }
      continue
    }

    merged[key] = childValue
  }

  return merged
}

export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
  if (!isValidElement(children)) return null

  const child = children as ReactElement<AnyProps>

  return cloneElement(child, {
    ...mergeProps(slotProps as AnyProps, child.props),
    ref: composeRefs(forwardedRef, getElementRef(child) as Ref<HTMLElement>),
  } as AnyProps)
})
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/utils/Slot.test.tsx`

Expected: PASS — 8 tests

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add Slot for asChild prop support"
```

---

### Task 4: 디자인 토큰 CSS

**Files:**
- Create: `src/styles/palette.css`, `src/styles/semantic.css`, `src/styles/schemes.css`, `src/styles/media.css`, `src/styles/reset.css`
- Modify: `src/styles/tokens.css` (Task 1의 빈 파일)

**Interfaces:**
- Consumes: 없음
- Produces: Task 5의 Button과 Task 6~7의 Storybook이 참조하는 전체 토큰. Button이 실제로 쓰는 것들:
  `--uikit-control-height-{sm,md,lg}`, `--uikit-space-{1,1-5,2,3,4,5}`, `--uikit-font-size-{sm,md}`, `--uikit-font-weight-medium`, `--uikit-line-height-tight`, `--uikit-radius-{sm,md,lg,full}`, `--uikit-border-width-thin`, `--uikit-duration-fast`, `--uikit-duration-spin`, `--uikit-ease-out`, `--uikit-color-disabled-{bg,fg,border}`, `--uikit-scheme-solid-{bg,bg-hover,bg-active,fg}`, `--uikit-scheme-outline-{border,fg,bg-hover}`, `--uikit-scheme-ghost-{fg,bg-hover}`, `--uikit-scheme-focus-ring`

- [ ] **Step 1: 원시 팔레트 작성**

`src/styles/palette.css`:

```css
:where(:root) {
  --uikit-color-gray-50: #f8fafc;
  --uikit-color-gray-100: #f1f5f9;
  --uikit-color-gray-200: #e2e8f0;
  --uikit-color-gray-300: #cbd5e1;
  --uikit-color-gray-400: #94a3b8;
  --uikit-color-gray-500: #64748b;
  --uikit-color-gray-600: #475569;
  --uikit-color-gray-700: #334155;
  --uikit-color-gray-800: #1e293b;
  --uikit-color-gray-900: #0f172a;

  --uikit-color-primary-50: #eff6ff;
  --uikit-color-primary-100: #dbeafe;
  --uikit-color-primary-200: #bfdbfe;
  --uikit-color-primary-300: #93c5fd;
  --uikit-color-primary-400: #60a5fa;
  --uikit-color-primary-500: #3b82f6;
  --uikit-color-primary-600: #2563eb;
  --uikit-color-primary-700: #1d4ed8;
  --uikit-color-primary-800: #1e40af;
  --uikit-color-primary-900: #1e3a8a;

  --uikit-color-secondary-50: #f5f3ff;
  --uikit-color-secondary-100: #ede9fe;
  --uikit-color-secondary-200: #ddd6fe;
  --uikit-color-secondary-300: #c4b5fd;
  --uikit-color-secondary-400: #a78bfa;
  --uikit-color-secondary-500: #8b5cf6;
  --uikit-color-secondary-600: #7c3aed;
  --uikit-color-secondary-700: #6d28d9;
  --uikit-color-secondary-800: #5b21b6;
  --uikit-color-secondary-900: #4c1d95;

  --uikit-color-danger-50: #fef2f2;
  --uikit-color-danger-100: #fee2e2;
  --uikit-color-danger-200: #fecaca;
  --uikit-color-danger-300: #fca5a5;
  --uikit-color-danger-400: #f87171;
  --uikit-color-danger-500: #ef4444;
  --uikit-color-danger-600: #dc2626;
  --uikit-color-danger-700: #b91c1c;
  --uikit-color-danger-800: #991b1b;
  --uikit-color-danger-900: #7f1d1d;

  --uikit-color-warning-50: #fffbeb;
  --uikit-color-warning-100: #fef3c7;
  --uikit-color-warning-200: #fde68a;
  --uikit-color-warning-300: #fcd34d;
  --uikit-color-warning-400: #fbbf24;
  --uikit-color-warning-500: #f59e0b;
  --uikit-color-warning-600: #d97706;
  --uikit-color-warning-700: #b45309;
  --uikit-color-warning-800: #92400e;
  --uikit-color-warning-900: #78350f;

  --uikit-color-success-50: #f0fdf4;
  --uikit-color-success-100: #dcfce7;
  --uikit-color-success-200: #bbf7d0;
  --uikit-color-success-300: #86efac;
  --uikit-color-success-400: #4ade80;
  --uikit-color-success-500: #22c55e;
  --uikit-color-success-600: #16a34a;
  --uikit-color-success-700: #15803d;
  --uikit-color-success-800: #166534;
  --uikit-color-success-900: #14532d;
}
```

- [ ] **Step 2: 시맨틱 별칭과 다크모드 작성**

`src/styles/semantic.css`:

```css
:where(:root) {
  --uikit-color-bg: #ffffff;
  --uikit-color-surface: #ffffff;
  --uikit-color-surface-subtle: var(--uikit-color-gray-50);
  --uikit-color-fg: var(--uikit-color-gray-900);
  --uikit-color-fg-muted: var(--uikit-color-gray-500);
  --uikit-color-border: var(--uikit-color-gray-200);
  --uikit-color-border-strong: var(--uikit-color-gray-300);
  --uikit-color-focus-ring: var(--uikit-color-primary-500);
  --uikit-color-disabled-bg: var(--uikit-color-gray-100);
  --uikit-color-disabled-fg: var(--uikit-color-gray-400);
  --uikit-color-disabled-border: var(--uikit-color-gray-200);

  --uikit-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --uikit-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --uikit-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --uikit-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

:where([data-theme='dark']) {
  --uikit-color-bg: var(--uikit-color-gray-900);
  --uikit-color-surface: var(--uikit-color-gray-800);
  --uikit-color-surface-subtle: var(--uikit-color-gray-800);
  --uikit-color-fg: var(--uikit-color-gray-50);
  --uikit-color-fg-muted: var(--uikit-color-gray-400);
  --uikit-color-border: var(--uikit-color-gray-700);
  --uikit-color-border-strong: var(--uikit-color-gray-600);
  --uikit-color-focus-ring: var(--uikit-color-primary-400);
  --uikit-color-disabled-bg: var(--uikit-color-gray-800);
  --uikit-color-disabled-fg: var(--uikit-color-gray-600);
  --uikit-color-disabled-border: var(--uikit-color-gray-700);

  --uikit-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --uikit-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5);
  --uikit-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.55), 0 4px 6px -4px rgb(0 0 0 / 0.55);
  --uikit-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6);
}
```

- [ ] **Step 3: 스킴 슬롯 작성**

`src/styles/schemes.css`:

`solid-fg`는 스킴마다 다르다. warning은 어떤 스텝에서도 흰 텍스트가 대비 4.5:1을 넘기지 못하므로 어두운 전경색을 쓰고, success는 600이 아니라 700을 solid 배경으로 쓴다.

```css
:where([data-scheme='primary']) {
  --uikit-scheme-solid-bg: var(--uikit-color-primary-600);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-primary-700);
  --uikit-scheme-solid-bg-active: var(--uikit-color-primary-800);
  --uikit-scheme-solid-fg: #ffffff;
  --uikit-scheme-subtle-bg: var(--uikit-color-primary-50);
  --uikit-scheme-subtle-bg-hover: var(--uikit-color-primary-100);
  --uikit-scheme-subtle-fg: var(--uikit-color-primary-700);
  --uikit-scheme-outline-border: var(--uikit-color-primary-600);
  --uikit-scheme-outline-fg: var(--uikit-color-primary-700);
  --uikit-scheme-outline-bg-hover: var(--uikit-color-primary-50);
  --uikit-scheme-ghost-fg: var(--uikit-color-primary-700);
  --uikit-scheme-ghost-bg-hover: var(--uikit-color-primary-50);
  --uikit-scheme-focus-ring: var(--uikit-color-primary-500);
}

:where([data-scheme='secondary']) {
  --uikit-scheme-solid-bg: var(--uikit-color-secondary-600);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-secondary-700);
  --uikit-scheme-solid-bg-active: var(--uikit-color-secondary-800);
  --uikit-scheme-solid-fg: #ffffff;
  --uikit-scheme-subtle-bg: var(--uikit-color-secondary-50);
  --uikit-scheme-subtle-bg-hover: var(--uikit-color-secondary-100);
  --uikit-scheme-subtle-fg: var(--uikit-color-secondary-700);
  --uikit-scheme-outline-border: var(--uikit-color-secondary-600);
  --uikit-scheme-outline-fg: var(--uikit-color-secondary-700);
  --uikit-scheme-outline-bg-hover: var(--uikit-color-secondary-50);
  --uikit-scheme-ghost-fg: var(--uikit-color-secondary-700);
  --uikit-scheme-ghost-bg-hover: var(--uikit-color-secondary-50);
  --uikit-scheme-focus-ring: var(--uikit-color-secondary-500);
}

:where([data-scheme='danger']) {
  --uikit-scheme-solid-bg: var(--uikit-color-danger-600);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-danger-700);
  --uikit-scheme-solid-bg-active: var(--uikit-color-danger-800);
  --uikit-scheme-solid-fg: #ffffff;
  --uikit-scheme-subtle-bg: var(--uikit-color-danger-50);
  --uikit-scheme-subtle-bg-hover: var(--uikit-color-danger-100);
  --uikit-scheme-subtle-fg: var(--uikit-color-danger-700);
  --uikit-scheme-outline-border: var(--uikit-color-danger-600);
  --uikit-scheme-outline-fg: var(--uikit-color-danger-700);
  --uikit-scheme-outline-bg-hover: var(--uikit-color-danger-50);
  --uikit-scheme-ghost-fg: var(--uikit-color-danger-700);
  --uikit-scheme-ghost-bg-hover: var(--uikit-color-danger-50);
  --uikit-scheme-focus-ring: var(--uikit-color-danger-500);
}

:where([data-scheme='warning']) {
  --uikit-scheme-solid-bg: var(--uikit-color-warning-500);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-warning-600);
  --uikit-scheme-solid-bg-active: var(--uikit-color-warning-700);
  --uikit-scheme-solid-fg: var(--uikit-color-gray-900);
  --uikit-scheme-subtle-bg: var(--uikit-color-warning-50);
  --uikit-scheme-subtle-bg-hover: var(--uikit-color-warning-100);
  --uikit-scheme-subtle-fg: var(--uikit-color-warning-800);
  --uikit-scheme-outline-border: var(--uikit-color-warning-600);
  --uikit-scheme-outline-fg: var(--uikit-color-warning-800);
  --uikit-scheme-outline-bg-hover: var(--uikit-color-warning-50);
  --uikit-scheme-ghost-fg: var(--uikit-color-warning-800);
  --uikit-scheme-ghost-bg-hover: var(--uikit-color-warning-50);
  --uikit-scheme-focus-ring: var(--uikit-color-warning-500);
}

:where([data-scheme='success']) {
  --uikit-scheme-solid-bg: var(--uikit-color-success-700);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-success-800);
  --uikit-scheme-solid-bg-active: var(--uikit-color-success-900);
  --uikit-scheme-solid-fg: #ffffff;
  --uikit-scheme-subtle-bg: var(--uikit-color-success-50);
  --uikit-scheme-subtle-bg-hover: var(--uikit-color-success-100);
  --uikit-scheme-subtle-fg: var(--uikit-color-success-800);
  --uikit-scheme-outline-border: var(--uikit-color-success-700);
  --uikit-scheme-outline-fg: var(--uikit-color-success-800);
  --uikit-scheme-outline-bg-hover: var(--uikit-color-success-50);
  --uikit-scheme-ghost-fg: var(--uikit-color-success-800);
  --uikit-scheme-ghost-bg-hover: var(--uikit-color-success-50);
  --uikit-scheme-focus-ring: var(--uikit-color-success-500);
}
```

- [ ] **Step 4: breakpoint 선언 작성**

`src/styles/media.css`:

```css
@custom-media --uikit-sm (min-width: 640px);
@custom-media --uikit-md (min-width: 768px);
@custom-media --uikit-lg (min-width: 1024px);
@custom-media --uikit-xl (min-width: 1280px);
```

이 파일은 `postcss.config.js`가 전역 데이터로 읽는다. 다른 CSS에서 import하지 않는다. import하면 최종 번들에 `@custom-media` 선언이 그대로 남아 브라우저가 무시하는 빈 규칙이 된다.

- [ ] **Step 5: 나머지 토큰과 진입 파일 작성**

`src/styles/tokens.css` (Task 1에서 만든 빈 파일을 아래 내용으로 채운다):

```css
@import './palette.css';
@import './semantic.css';
@import './schemes.css';
@import './reset.css';

:where(:root) {
  --uikit-font-family: -apple-system, BlinkMacSystemFont, 'Pretendard Variable',
    Pretendard, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif;
  --uikit-font-family-mono: 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', monospace;

  --uikit-font-size-xs: 0.75rem;
  --uikit-font-size-sm: 0.875rem;
  --uikit-font-size-md: 1rem;
  --uikit-font-size-lg: 1.125rem;
  --uikit-font-size-xl: 1.25rem;
  --uikit-font-size-2xl: 1.5rem;
  --uikit-font-size-3xl: 1.875rem;
  --uikit-font-size-4xl: 2.25rem;

  --uikit-font-weight-normal: 400;
  --uikit-font-weight-medium: 500;
  --uikit-font-weight-semibold: 600;
  --uikit-font-weight-bold: 700;

  --uikit-line-height-tight: 1.25;
  --uikit-line-height-snug: 1.375;
  --uikit-line-height-normal: 1.5;
  --uikit-line-height-relaxed: 1.625;

  --uikit-letter-spacing-tight: -0.02em;
  --uikit-letter-spacing-normal: 0;
  --uikit-letter-spacing-wide: 0.02em;

  --uikit-space-0: 0;
  --uikit-space-1: 0.25rem;
  --uikit-space-1-5: 0.375rem;
  --uikit-space-2: 0.5rem;
  --uikit-space-3: 0.75rem;
  --uikit-space-4: 1rem;
  --uikit-space-5: 1.25rem;
  --uikit-space-6: 1.5rem;
  --uikit-space-8: 2rem;
  --uikit-space-10: 2.5rem;
  --uikit-space-12: 3rem;
  --uikit-space-16: 4rem;

  --uikit-control-height-sm: 2rem;
  --uikit-control-height-md: 2.5rem;
  --uikit-control-height-lg: 3rem;

  --uikit-radius-none: 0;
  --uikit-radius-sm: 4px;
  --uikit-radius-md: 6px;
  --uikit-radius-lg: 8px;
  --uikit-radius-xl: 12px;
  --uikit-radius-full: 9999px;

  --uikit-border-width-thin: 1px;
  --uikit-border-width-thick: 2px;

  --uikit-z-base: 0;
  --uikit-z-dropdown: 1000;
  --uikit-z-sticky: 1100;
  --uikit-z-overlay: 1200;
  --uikit-z-modal: 1300;
  --uikit-z-popover: 1400;
  --uikit-z-toast: 1500;
  --uikit-z-tooltip: 1600;

  --uikit-duration-instant: 50ms;
  --uikit-duration-fast: 150ms;
  --uikit-duration-normal: 200ms;
  --uikit-duration-slow: 300ms;
  --uikit-duration-spin: 600ms;

  --uikit-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --uikit-ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --uikit-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --uikit-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  :where(:root) {
    --uikit-duration-instant: 0.01ms;
    --uikit-duration-fast: 0.01ms;
    --uikit-duration-normal: 0.01ms;
    --uikit-duration-slow: 0.01ms;
    --uikit-duration-spin: 1.5s;
  }
}
```

`--uikit-duration-spin`은 `prefers-reduced-motion`에서 `0.01ms`가 아니라 `1.5s`가 된다. 로딩 스피너는 진행 중이라는 상태를 전달하는 요소라 완전히 멈추면 정보가 사라진다. 대신 회전을 느리게 해 어지러움을 줄인다.

`src/styles/reset.css`:

```css
:where(:root) {
  color-scheme: light;
}

:where([data-theme='dark']) {
  color-scheme: dark;
}
```

`color-scheme`이 필요한 이유는 브라우저가 스크롤바, 폼 컨트롤 기본 UI, `input` 자동완성 배경을 이 값에 맞춰 그리기 때문이다. 다크 테마에서 이걸 빼면 스크롤바만 밝게 남는다.

- [ ] **Step 6: 빌드로 CSS 파이프라인 검증**

Run: `pnpm build`

Expected: 성공.

```bash
head -5 dist/assets/index.css
```

Expected: `--uikit-color-gray-50` 등 팔레트 변수가 보인다. `@import`가 인라인되어 하나의 CSS로 합쳐졌음을 의미한다.

- [ ] **Step 7: breakpoint 해석 검증**

Button은 미디어쿼리를 쓰지 않으므로, 검증하지 않으면 `postcss.config.js`가 틀려도 아무도 모른 채 넘어간다. `@custom-media`가 실제 값으로 치환되는지 임시 규칙으로 확인한다.

`src/styles/reset.css` 끝에 임시로 추가한다:

```css
@media (--uikit-md) {
  :where(:root) {
    --uikit-breakpoint-probe: ok;
  }
}
```

Run:

```bash
pnpm build && grep -c 'min-width: *768px' dist/assets/index.css
```

Expected: `1` 이상. `0`이 나오면 `@custom-media`가 해석되지 않은 것이다. 이 경우 `postcss.config.js`의 플러그인 순서(`globalData` → `customMedia`)와 `globalData`의 `files` 경로를 확인한다.

확인 후 방금 추가한 임시 규칙을 `reset.css`에서 삭제한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: add design token stylesheets"
```

---

### Task 5: Button

**Files:**
- Create: `src/components/Button/Button.tsx`, `src/components/Button/Button.module.css`, `src/components/Button/Button.test.tsx`, `src/components/Button/index.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `cx` (Task 2), `Slot` (Task 3), `Size`/`ColorScheme` (Task 1), 토큰 CSS (Task 4)
- Produces: `Button` — `forwardRef<HTMLButtonElement, ButtonProps>`.
  `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>` 에 더해
  `variant?: 'solid' | 'outline' | 'ghost' | 'link'` (기본 `'solid'`),
  `size?: Size` (기본 `'md'`),
  `colorScheme?: ColorScheme` (기본 `'primary'`),
  `isLoading?: boolean`, `fullWidth?: boolean`, `asChild?: boolean`.
  Task 6의 스토리가 사용한다.

**확정된 디자인 값:**

| | sm | md | lg |
|---|---|---|---|
| height | `control-height-sm` 32px | `control-height-md` 40px | `control-height-lg` 48px |
| 좌우 padding | `space-3` 12px | `space-4` 16px | `space-5` 20px |
| font-size | `font-size-sm` 14px | `font-size-sm` 14px | `font-size-md` 16px |
| gap | `space-1` 4px | `space-1-5` 6px | `space-2` 8px |
| 아이콘 크기 | 14px | 16px | 18px |
| border-radius | `radius-sm` 4px | `radius-md` 6px | `radius-lg` 8px |
| min-width | 64px | 80px | 96px |

`disabled`는 전용 회색 토큰(`--uikit-color-disabled-*`)과 `cursor: not-allowed`로 표현한다. `pointer-events`는 건드리지 않는다. 그래야 나중에 disabled 버튼 위에 Tooltip을 붙일 수 있다.

포커스 링은 `outline: 2px solid var(--uikit-scheme-focus-ring)` + `outline-offset: 2px`이다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Button/Button.test.tsx`:

```tsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/Button`

Expected: FAIL — `Failed to resolve import "./Button"`

- [ ] **Step 3: 구현 작성**

`src/components/Button/Button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'
import { Slot } from '../../utils/Slot'
import type { ColorScheme, Size, Variant } from '../../types'
import styles from './Button.module.css'

/** Button은 공통 variant 축을 그대로 쓴다. 축이 다른 컴포넌트는 자기 유니온을 좁혀 선언한다. */
export type ButtonVariant = Variant

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 시각적 강조 단계. 기본 'solid' */
  variant?: ButtonVariant
  /** height 기준 크기 단계. 기본 'md' */
  size?: Size
  /** 색상 계열. 기본 'primary' */
  colorScheme?: ColorScheme
  /** 진행 중 표시. 스피너를 띄우고 버튼을 비활성화한다 */
  isLoading?: boolean
  /** 부모 폭을 가득 채운다 */
  fullWidth?: boolean
  /** 자식 엘리먼트를 대신 렌더링한다 */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    size = 'md',
    colorScheme = 'primary',
    isLoading = false,
    fullWidth = false,
    asChild = false,
    disabled,
    className,
    children,
    type,
    ...rest
  },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  const isDisabled = disabled || isLoading

  // asChild일 때 렌더 대상은 button이 아닐 수 있으므로 button 전용 속성을 넘기지 않는다.
  const buttonOnlyProps = asChild
    ? {}
    : { type: type ?? 'button', disabled: isDisabled }

  return (
    <Component
      ref={ref}
      className={cx(styles.button, className)}
      data-variant={variant}
      data-size={size}
      data-scheme={colorScheme}
      data-full-width={fullWidth || undefined}
      data-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      aria-disabled={asChild && isDisabled ? true : undefined}
      {...buttonOnlyProps}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </Component>
  )
})
```

`data-*` 속성으로 변형을 표현하는 이유가 두 가지다. 첫째, `data-scheme`은 스킴 슬롯 CSS가 이미 선택자로 쓰고 있어 별도 클래스가 필요 없다. 둘째, `className`을 단일 클래스로 유지하면 소비자가 `className`으로 덮어쓸 때 specificity 싸움이 단순해진다.

`src/components/Button/index.ts`:

```ts
export { Button } from './Button'
export type { ButtonProps, ButtonVariant } from './Button'
```

`src/index.ts`를 아래로 교체한다:

```ts
import './styles/tokens.css'

export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant } from './components/Button'
export type { Size, ColorScheme, Variant } from './types'
```

- [ ] **Step 4: 스타일 작성**

`src/components/Button/Button.module.css`:

```css
/* font-family만 specificity 0으로 낮춰 소비자의 `button { font-family: ... }`에 양보한다 */
:where(.button) {
  font-family: var(--uikit-font-family, inherit);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: var(--uikit-border-width-thin) solid transparent;
  font-weight: var(--uikit-font-weight-medium);
  line-height: var(--uikit-line-height-tight);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--uikit-duration-fast) var(--uikit-ease-out),
    border-color var(--uikit-duration-fast) var(--uikit-ease-out),
    color var(--uikit-duration-fast) var(--uikit-ease-out);
}

.button:focus-visible {
  outline: 2px solid var(--uikit-scheme-focus-ring);
  outline-offset: 2px;
}

.button > svg {
  width: var(--uikit-button-icon-size);
  height: var(--uikit-button-icon-size);
  flex-shrink: 0;
}

/* ---- size ---- */

.button[data-size='sm'] {
  --uikit-button-icon-size: 14px;
  height: var(--uikit-control-height-sm);
  min-width: 64px;
  padding-inline: var(--uikit-space-3);
  gap: var(--uikit-space-1);
  font-size: var(--uikit-font-size-sm);
  border-radius: var(--uikit-radius-sm);
}

.button[data-size='md'] {
  --uikit-button-icon-size: 16px;
  height: var(--uikit-control-height-md);
  min-width: 80px;
  padding-inline: var(--uikit-space-4);
  gap: var(--uikit-space-1-5);
  font-size: var(--uikit-font-size-sm);
  border-radius: var(--uikit-radius-md);
}

.button[data-size='lg'] {
  --uikit-button-icon-size: 18px;
  height: var(--uikit-control-height-lg);
  min-width: 96px;
  padding-inline: var(--uikit-space-5);
  gap: var(--uikit-space-2);
  font-size: var(--uikit-font-size-md);
  border-radius: var(--uikit-radius-lg);
}

/* ---- variant ---- */

.button[data-variant='solid'] {
  background-color: var(--uikit-scheme-solid-bg);
  color: var(--uikit-scheme-solid-fg);
}

.button[data-variant='solid']:hover:not([data-disabled]) {
  background-color: var(--uikit-scheme-solid-bg-hover);
}

.button[data-variant='solid']:active:not([data-disabled]) {
  background-color: var(--uikit-scheme-solid-bg-active);
}

.button[data-variant='outline'] {
  background-color: transparent;
  color: var(--uikit-scheme-outline-fg);
  border-color: var(--uikit-scheme-outline-border);
}

.button[data-variant='outline']:hover:not([data-disabled]) {
  background-color: var(--uikit-scheme-outline-bg-hover);
}

.button[data-variant='ghost'] {
  background-color: transparent;
  color: var(--uikit-scheme-ghost-fg);
}

.button[data-variant='ghost']:hover:not([data-disabled]) {
  background-color: var(--uikit-scheme-ghost-bg-hover);
}

/* link는 인라인 텍스트처럼 흐르므로 크기 규칙 대부분을 되돌린다 */
.button[data-variant='link'] {
  height: auto;
  min-width: 0;
  padding-inline: 0;
  background-color: transparent;
  color: var(--uikit-scheme-ghost-fg);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.button[data-variant='link']:hover:not([data-disabled]) {
  text-decoration-thickness: 2px;
}

/* ---- state ---- */

.button[data-disabled] {
  cursor: not-allowed;
  color: var(--uikit-color-disabled-fg);
}

.button[data-variant='solid'][data-disabled] {
  background-color: var(--uikit-color-disabled-bg);
  border-color: transparent;
}

.button[data-variant='outline'][data-disabled] {
  background-color: transparent;
  border-color: var(--uikit-color-disabled-border);
}

.button[data-variant='ghost'][data-disabled],
.button[data-variant='link'][data-disabled] {
  background-color: transparent;
}

.button[data-full-width] {
  width: 100%;
  min-width: 0;
}

/* ---- loading ---- */

.spinner {
  width: var(--uikit-button-icon-size);
  height: var(--uikit-button-icon-size);
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--uikit-radius-full);
  flex-shrink: 0;
  animation: uikit-button-spin var(--uikit-duration-spin) linear infinite;
}

@keyframes uikit-button-spin {
  to {
    transform: rotate(360deg);
  }
}
```

`min-width: 0`을 `data-full-width`에 넣는 이유는, 폭이 매우 좁은 부모 안에서 `min-width: 80px`가 남아 있으면 부모를 넘쳐 가로 스크롤을 만들기 때문이다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test src/components/Button`

Expected: PASS — 15 tests

- [ ] **Step 6: 타입 체크와 빌드 확인**

Run: `pnpm build`

Expected: 성공. `dist/components/Button/Button.js`와 `dist/components/Button/Button.d.ts`가 생성된다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add Button component"
```

---

### Task 6: Storybook과 Button 스토리

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/preview.css`, `src/components/Button/Button.stories.tsx`

**Interfaces:**
- Consumes: `Button` (Task 5), 토큰 CSS (Task 4)
- Produces: `pnpm storybook`으로 뜨는 개발 서버. `parameters.fixedWidth` 파라미터를 지정한 스토리는 해당 px 폭 컨테이너로 감싸진다. 툴바의 테마 토글이 preview 루트에 `data-theme`을 설정한다. Task 7이 같은 preview 설정 위에 Docs 페이지를 얹는다.

- [ ] **Step 1: Storybook 설치**

```bash
pnpm dlx storybook@latest init --builder vite --type react --no-dev
```

설치 마법사가 예제 스토리(`src/stories/`)를 만들면 삭제한다. 우리 구조와 맞지 않는다.

```bash
rm -rf src/stories
pnpm add -D @storybook/addon-a11y
```

- [ ] **Step 2: `.storybook/main.ts` 작성**

마법사가 만든 파일을 아래로 교체한다.

```ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../.storybook/**/*.mdx',
    '../.storybook/**/*.stories.@(ts|tsx)',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
```

Storybook 9는 controls, actions, viewport를 코어에 내장하고 있어 별도 애드온으로 추가하지 않는다. 마법사가 `@storybook/addon-essentials`를 넣었다면 제거한다.

- [ ] **Step 3: preview 스타일과 설정 작성**

`.storybook/preview.css`:

```css
body {
  margin: 0;
  padding: var(--uikit-space-6);
  background-color: var(--uikit-color-bg);
  color: var(--uikit-color-fg);
  font-family: var(--uikit-font-family);
}
```

`.storybook/preview.tsx`:

```tsx
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
```

- [ ] **Step 4: Button 스토리 작성**

`src/components/Button/Button.stories.tsx`:

```tsx
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
```

- [ ] **Step 5: Storybook 실행 확인**

Run: `pnpm storybook`

브라우저에서 `http://localhost:6006`을 열어 확인한다:
- `Primitives/Button`의 7개 스토리가 모두 렌더링된다
- 툴바의 Theme을 Dark로 바꾸면 배경과 텍스트 색이 반전된다
- `ColorSchemes` 스토리에서 5개 스킴이 서로 다른 색으로 보인다
- `FullWidth` 스토리의 버튼이 480px 컨테이너를 가득 채운다
- `States` 스토리에서 Loading 버튼의 스피너가 회전한다
- Tab 키로 버튼을 이동하면 포커스 링이 보이고, 마우스 클릭에는 보이지 않는다

확인 후 `Ctrl+C`로 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add storybook with theme toolbar and Button stories"
```

---

### Task 7: Foundation Docs와 토큰 라이브 플레이그라운드

**Files:**
- Create: `.storybook/Foundation.mdx`, `.storybook/TokenPlayground.stories.tsx`, `.storybook/tokenControl.ts`

**Interfaces:**
- Consumes: 토큰 CSS (Task 4), `Button` (Task 5), preview 설정 (Task 6)
- Produces: 토큰 값을 시각적으로 나열하는 Docs 페이지와, 토큰을 실시간으로 바꿔 Button에 즉시 반영되는지 확인하는 스토리.

- [ ] **Step 1: 토큰 오버라이드 유틸 작성**

`.storybook/tokenControl.ts`:

```ts
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
```

`document.documentElement`에 인라인 스타일로 쓰기 때문에, 여기서 바꾼 값은 preview iframe 안의 **모든 스토리**에 적용된다. 스토리를 옮겨 다녀도 값이 유지되고, `localStorage` 덕분에 새로고침해도 남는다. Foundation과 컴포넌트가 분리되어 보이지 않게 하려는 것이 목적이다.

- [ ] **Step 2: 토큰 플레이그라운드 스토리 작성**

`.storybook/TokenPlayground.stories.tsx`:

```tsx
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

        <div style={row}>
          <label htmlFor="tp-primary">primary-600</label>
          <input
            id="tp-primary"
            type="color"
            value={overrides['--uikit-color-primary-600'] || '#2563eb'}
            onChange={(e) => set('--uikit-color-primary-600', e.target.value)}
          />
        </div>

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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button>Primary Solid</Button>
          <Button variant="outline">Primary Outline</Button>
          <Button variant="ghost">Primary Ghost</Button>
          <Button colorScheme="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
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
```

- [ ] **Step 3: Foundation Docs 페이지 작성**

`.storybook/Foundation.mdx`:

Docs 블록의 import 경로는 Storybook 9 기준이다. 설치된 버전이 8.x라면 `@storybook/blocks`에서 import해야 한다. 개발 서버가 `Meta`를 찾지 못하면 이 경로부터 확인한다.

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Foundation/Overview" />

# Foundation

모든 컴포넌트는 여기 정의된 토큰만 참조합니다. 컴포넌트 CSS에 하드코딩된 값은 없습니다.

소비하는 프로젝트에서 아래처럼 덮어쓰면 모든 컴포넌트에 반영됩니다.

```css
:root {
  --uikit-color-primary-600: #ff5722;
  --uikit-radius-md: 12px;
}
```

## 색상 팔레트

<div style={{ display: 'grid', gap: 16 }}>
  {['gray', 'primary', 'secondary', 'danger', 'warning', 'success'].map((scheme) => (
    <div key={scheme}>
      <strong>{scheme}</strong>
      <div style={{ display: 'flex', marginTop: 4 }}>
        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
          <div key={step} style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>
            <div
              style={{
                height: 48,
                background: `var(--uikit-color-${scheme}-${step})`,
                border: '1px solid var(--uikit-color-border)',
              }}
            />
            {step}
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

`gray`는 팔레트로만 존재하며 `colorScheme` 값으로는 노출되지 않습니다.

## 타이포그래피

<div style={{ display: 'grid', gap: 8 }}>
  {['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'].map((size) => (
    <div key={size} style={{ fontSize: `var(--uikit-font-size-${size})` }}>
      font-size-{size} — 다람쥐 헌 쳇바퀴에 타고파 The quick brown fox
    </div>
  ))}
</div>

## 간격

<div style={{ display: 'grid', gap: 4 }}>
  {['1', '1-5', '2', '3', '4', '5', '6', '8', '10', '12', '16'].map((step) => (
    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <code style={{ width: 160, fontSize: 12 }}>--uikit-space-{step}</code>
      <div
        style={{
          height: 16,
          width: `var(--uikit-space-${step})`,
          background: 'var(--uikit-color-primary-500)',
        }}
      />
    </div>
  ))}
</div>

`space-1-5`(6px)는 4px 스케일의 반 단계입니다. 아이콘과 텍스트 사이 간격처럼 4px는 좁고
8px는 넓은 컴포넌트 내부 치수를 위해 존재합니다.

## 컨트롤 높이

`size` 축은 height로 구분합니다. Button, Input, Select 등 인터랙티브 컨트롤이 같은 토큰을
공유하므로 나란히 놓으면 높이가 정확히 맞습니다.

<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
  {['sm', 'md', 'lg'].map((size) => (
    <div
      key={size}
      style={{
        height: `var(--uikit-control-height-${size})`,
        padding: '0 var(--uikit-space-4)',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--uikit-color-border)',
        borderRadius: 'var(--uikit-radius-md)',
        fontSize: 12,
      }}
    >
      {size}
    </div>
  ))}
</div>

## radius와 shadow

<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
  {['sm', 'md', 'lg', 'xl', 'full'].map((r) => (
    <div
      key={r}
      style={{
        width: 88,
        height: 56,
        display: 'grid',
        placeItems: 'center',
        fontSize: 12,
        background: 'var(--uikit-color-surface)',
        border: '1px solid var(--uikit-color-border)',
        borderRadius: `var(--uikit-radius-${r})`,
      }}
    >
      {r}
    </div>
  ))}
</div>

<div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
  {['sm', 'md', 'lg', 'xl'].map((s) => (
    <div
      key={s}
      style={{
        width: 88,
        height: 56,
        display: 'grid',
        placeItems: 'center',
        fontSize: 12,
        background: 'var(--uikit-color-surface)',
        borderRadius: 'var(--uikit-radius-md)',
        boxShadow: `var(--uikit-shadow-${s})`,
      }}
    >
      {s}
    </div>
  ))}
</div>

## z-index

| 토큰 | 값 | 토큰 | 값 |
|---|---|---|---|
| `--uikit-z-base` | 0 | `--uikit-z-modal` | 1300 |
| `--uikit-z-dropdown` | 1000 | `--uikit-z-popover` | 1400 |
| `--uikit-z-sticky` | 1100 | `--uikit-z-toast` | 1500 |
| `--uikit-z-overlay` | 1200 | `--uikit-z-tooltip` | 1600 |

## breakpoint

| 이름 | 값 |
|---|---|
| `--uikit-sm` | 640px |
| `--uikit-md` | 768px |
| `--uikit-lg` | 1024px |
| `--uikit-xl` | 1280px |

breakpoint만은 CSS 커스텀 프로퍼티가 아닙니다. 미디어쿼리가 `var()`를 해석하지 못하기
때문에 PostCSS의 `@custom-media`로 관리하며, 소비자가 런타임에 덮어쓸 수 없습니다.

## motion

`prefers-reduced-motion: reduce`에서 duration 토큰은 모두 `0.01ms`가 됩니다. 다만
`--uikit-duration-spin`만 `1.5s`로 남습니다. 로딩 스피너는 진행 중이라는 상태를 전달하므로
멈추면 정보가 사라지기 때문입니다.
```

- [ ] **Step 4: 실행 확인**

Run: `pnpm storybook`

브라우저에서 확인한다:
- `Foundation/Overview`에서 6개 팔레트, 타이포 스케일, 간격 바, 컨트롤 높이, radius/shadow가 렌더링된다
- `Foundation/Token Playground`에서 primary-600 색을 바꾸면 아래 Button들이 즉시 그 색으로 바뀐다
- radius와 control-height 슬라이더를 움직이면 Button 모양이 실시간으로 변한다
- font-family를 Georgia로 바꾸면 Button 글꼴이 바뀐다
- `Primitives/Button`으로 이동해도 바꾼 값이 유지된다
- 「전부 되돌리기」를 누르면 원래 값으로 복원된다

확인 후 종료한다.

- [ ] **Step 5: 최종 검증**

```bash
pnpm test
pnpm build
pnpm build-storybook
```

Expected: 세 명령 모두 성공.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add foundation docs and live token playground"
```

---

## 완료 기준

- `pnpm test` 전체 통과 (cx 4 + Slot 8 + Button 15 = 27 tests)
- `pnpm build`가 `dist/index.js`, `dist/index.d.ts`, `dist/components/Button/Button.js`를 생성
- `pnpm build-storybook` 성공
- Storybook에서 Button의 4 variant × 5 colorScheme × 3 size와 default/hover/focus-visible/disabled/loading 상태가 모두 확인 가능
- Token Playground에서 토큰을 바꾸면 다른 스토리의 컴포넌트에도 반영됨
- 다크 테마 토글이 동작함

## 다음 사이클

Tier 1의 나머지 컴포넌트로 넘어간다. 각 컴포넌트마다 변수화할 항목 목록을 제안하고 선택받는 절차를 먼저 거친다. `min-width`가 필요한 컴포넌트는 값을 반드시 확인받는다.
