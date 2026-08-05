# UI Kit 설계

날짜: 2026-08-05
패키지: `@green9930/ui-kit`

## 목적

여러 사이드 프로젝트에서 재사용할 React UI 컴포넌트 킷. npm에 공개 배포하고, 소비하는 프로젝트가 어떤 스타일링 스택을 쓰든 제약 없이 커스터마이징할 수 있어야 한다.

## 핵심 제약

소비 측 자유도가 최우선 목표다. 설계 전반이 여기서 도출된다.

- 소비 프로젝트에 특정 스타일링 라이브러리(Tailwind 등)를 강제하지 않는다.
- 소비자가 CSS import 없이 바로 쓸 수 있다.
- 런타임 의존성 0. React만 peer dependency.

## 커스터마이징 3레이어

### 레이어 1 — 토큰 오버라이드 (전역 테마)

```css
:root {
  --uikit-color-primary: #ff5722;
  --uikit-radius-md: 12px;
}
```

토큰은 `:where(:root)`에 정의한다. `:where()`의 specificity가 0이므로 소비자가 평범한 `:root {}`로 선언하면 항상 이긴다.

이 레이어가 성립하려면 **컴포넌트 CSS에 하드코딩된 값이 하나도 없어야 한다**. 색상, 간격, radius, 폰트 크기, 그림자, transition 전부 토큰 변수를 참조한다. 이 규칙을 어기면 해당 속성은 소비자가 테마로 바꿀 수 없게 된다.

### 레이어 2 — className (개별 조정)

```jsx
<Button className="my-custom" />        // Tailwind, CSS Modules, 일반 CSS 모두 동작
```

모든 컴포넌트는 `className` prop을 받아 내부 클래스 뒤에 병합한다. CSS Modules의 해시 클래스는 단일 클래스 selector라 specificity가 낮아, 소비자 클래스가 확실히 덮어쓴다.

### 레이어 3 — 네이티브 props 통과

```jsx
<Button ref={btnRef} data-testid="x" aria-describedby="y" onPointerDown={...} />
```

모든 컴포넌트가 `forwardRef`를 쓰고 대응하는 네이티브 엘리먼트의 props를 전부 상속(`ComponentPropsWithoutRef<'button'>`)한 뒤 `...rest`로 전달한다.

`asChild` / polymorphic `as` prop은 1차 범위에서 제외한다 (Text 제외). 필요해지면 추가한다.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | React 18+ (peer dependency) |
| 언어 | TypeScript |
| 빌드 | Vite library mode |
| 스타일링 | CSS Modules + CSS 커스텀 프로퍼티 |
| 문서화 | Storybook (`@storybook/react-vite`) |
| 테스트 | Vitest + Testing Library + jsdom |
| 패키지 매니저 | pnpm 9.2.0 (개발), npm 레지스트리 (배포) |

레지스트리와 패키지 매니저는 독립적이다. npm 레지스트리에 publish하면 소비 측은 pnpm/npm/yarn/bun 무엇이든 설치할 수 있으며 별도 설정이 필요 없다.

## 디렉토리 구조

```
ui-kit/
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Textarea/
│   │   ├── Checkbox/
│   │   ├── Radio/
│   │   ├── Select/
│   │   ├── Stack/
│   │   └── Text/
│   ├── styles/
│   │   ├── tokens.css
│   │   └── reset.css
│   ├── utils/
│   │   └── cx.ts
│   ├── types.ts
│   └── index.ts
├── .npmrc
├── vite.config.ts
├── tsconfig.json
└── package.json
```

컴포넌트 하나가 폴더 하나이고 파일 5개(구현, 스타일, 테스트, 스토리, 배럴)로 고정된다. 컴포넌트끼리 서로를 import하지 않으므로 각각 독립적으로 읽고, 수정하고, 테스트할 수 있다.

## 토큰 설계

`src/styles/tokens.css`에 다음 카테고리를 정의한다. 모든 변수는 `--uikit-` 접두사를 쓴다.

- **color**: `primary`, `primary-hover`, `primary-active`, `danger`, `text`, `text-muted`, `border`, `border-focus`, `surface`, `bg`, `disabled`
- **space**: `1`~`8` (4px 단위)
- **radius**: `sm`, `md`, `lg`, `full`
- **typography**: `font-family`, `font-size-sm|md|lg`, `font-weight-normal|medium|bold`, `line-height-tight|normal`
- **shadow**: `sm`, `md`, `lg`
- **transition**: `fast`, `normal`

다크 모드는 `[data-theme="dark"]` 블록에서 같은 토큰을 재정의한다. 소비자가 루트에 속성을 붙여야 활성화되므로 기본 동작에 영향이 없다.

## 빌드 설정

- **출력 포맷**: ESM 단독. 소비처가 Vite/Next 기반이라 CJS는 불필요.
- **타입**: `vite-plugin-dts`로 `.d.ts` 생성.
- **CSS 주입**: `vite-plugin-lib-inject-css` + rollup `preserveModules: true`. 각 컴포넌트 JS가 자기 CSS를 스스로 import하므로 소비자는 CSS를 별도로 import하지 않으며, 사용하지 않은 컴포넌트는 JS와 CSS 모두 트리셰이킹된다.
- **external**: `react`, `react-dom`, `react/jsx-runtime`.
- **peerDependencies**: `react >=18`, `react-dom >=18`.
- **package.json**: `"type": "module"`, `"sideEffects": ["*.css"]`, `"packageManager": "pnpm@9.2.0"`.

`.npmrc`에 `auto-install-peers=true`를 설정한다. pnpm의 격리된 node_modules 구조에서 Storybook 애드온이 peer dependency를 해석하지 못하는 문제를 예방한다.

## 1차 컴포넌트

| 컴포넌트 | 기반 엘리먼트 | 주요 prop |
|---|---|---|
| Button | `button` | `variant: solid \| outline \| ghost`, `size: sm \| md \| lg`, `isLoading`, `fullWidth` |
| Input | `input` | `label`, `description`, `error`, `size` |
| Textarea | `textarea` | `label`, `description`, `error` |
| Checkbox | `input[type=checkbox]` | `label`, `error` |
| Radio | `input[type=radio]` | `label`, `error` |
| Select | `select` | `label`, `description`, `error`, `options` |
| Stack | `div` | `direction`, `gap`, `align`, `justify`, `wrap` |
| Text | 가변 | `as`, `size`, `weight`, `color` |

`Stack`의 `gap`은 space 토큰 키(`1`~`8`)만 받는다. 임의 CSS 길이는 허용하지 않는다 — 간격 스케일을 일관되게 유지하고 소비자가 토큰 오버라이드로 전체 밀도를 조정할 수 있게 하기 위해서다. `Text`의 `color`는 color 토큰 중 텍스트용(`text`, `text-muted`, `primary`, `danger`)만 받는다.

### 접근성

외부 headless 라이브러리 없이 직접 구현하되, **네이티브 엘리먼트를 최대한 살리는 방식**으로 접근한다.

- Checkbox / Radio는 실제 `<input>`을 유지하고 `appearance: none`으로 스타일링한다. 커스텀 `div`로 대체하지 않는다. 키보드 조작, 폼 제출, 스크린리더 지원이 브라우저에서 그대로 온다.
- Select는 네이티브 `<select>`를 스타일링한다. 커스텀 드롭다운이 아니다.
- 폼 컴포넌트는 `useId`로 label ↔ input ↔ description/error를 `htmlFor`, `aria-describedby`, `aria-invalid`로 자동 연결한다. 소비자가 id를 직접 넘기면 그것을 우선한다.
- 포커스 표시는 `:focus-visible`로 처리하며 `outline`을 제거하지 않는다.

### 범위 밖

Modal, Tooltip, Dropdown, Toast, 커스텀 Select는 1차 범위에서 제외한다. 포커스 트랩, 포탈, 충돌 감지, 스크롤 락이 필요해 별도 설계 사이클이 맞다.

## 테스트 전략

Vitest + Testing Library + jsdom. 컴포넌트마다 다음을 검증한다.

1. 기본 렌더링과 children 반영
2. variant / size prop이 클래스에 반영되는지
3. 이벤트 핸들러 호출 (click, change 등)
4. `ref` 전달
5. `className`이 내부 클래스와 함께 병합되는지
6. 폼 컴포넌트의 경우 label ↔ input aria 연결

컴포넌트 CSS의 시각적 검증은 Storybook a11y 애드온과 수동 확인에 맡긴다. 시각 회귀 테스트는 도입하지 않는다.

## 배포

```
pnpm build          # dist 생성
pnpm test           # Vitest
npm version patch   # 버전 증가 + 태그
npm publish         # 공개 배포 (--access public)
```

`prepublishOnly`에 빌드와 테스트를 걸어 깨진 산출물이 배포되는 것을 막는다. changesets와 GitHub Actions 자동 배포는 현 단계에서 과잉이라 도입하지 않는다.

npm 스코프 `@green9930`은 npm 계정 username과 일치한다. 스코프 패키지는 기본이 private이므로 `--access public`이 필요하다.

## Git

이 저장소에만 로컬 config를 적용한다. 전역 설정(회사 계정)을 건드리지 않는다.

```
user.name  = green9930
user.email = 69451758+green9930@users.noreply.github.com
```

`gh` CLI는 현재 `geuna0204` 계정으로 인증되어 있다. green9930으로 푸시하려면 `gh auth login`으로 계정을 추가해야 하며 브라우저 로그인이 필요하므로 사용자가 직접 실행한다. 그전까지는 로컬 커밋만 쌓는다.

## 열린 항목

- npm 계정 `green9930`이 실제로 존재하는지는 배포 시점에 확인한다. 없으면 그때 생성한다.
