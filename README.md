# @green9930/ui-kit

여러 사이드 프로젝트에서 재사용할 React UI 컴포넌트 킷. npm에 공개 배포하며, 소비하는 프로젝트가 어떤 스타일링 스택(Tailwind, CSS Modules, 일반 CSS, styled-components 등)을 쓰든 제약 없이 커스터마이징할 수 있게 설계했다.

- 런타임 의존성 0개. `react`/`react-dom`만 peer dependency.
- ESM 전용. CSS import 없이 바로 쓸 수 있다 — 각 컴포넌트가 자기 CSS를 스스로 가져온다.
- 사용하지 않는 컴포넌트는 JS/CSS 모두 트리셰이킹된다.

## 설치

```bash
pnpm add @green9930/ui-kit react react-dom
```

npm/yarn/bun으로도 설치할 수 있다. 패키지 매니저는 소비 측 자유이며, 이 저장소 자체의 개발에만 pnpm을 쓴다.

## 사용

```tsx
import { Button } from '@green9930/ui-kit'

function App() {
  return <Button colorScheme="primary">저장하기</Button>
}
```

## 커스터마이징 3레이어

컴포넌트 스타일을 바꾸는 방법은 세 층으로 나뉘고, 아래로 갈수록 좁고 구체적인 조정이다.

### 레이어 1 — 토큰 오버라이드 (전역 테마)

색상, 간격, radius, 폰트 크기, 그림자, transition 전부 `--uikit-` 커스텀 프로퍼티를 참조한다. `:root`에 같은 이름으로 다시 선언하면 전역으로 바뀐다.

```css
:root {
  --uikit-color-primary-600: #ff5722;
  --uikit-radius-md: 12px;
}
```

토큰은 라이브러리 안에서 `:where(:root) { ... }`로 정의되어 있어 specificity가 0이다. 소비자가 평범한 `:root { ... }`(specificity 1)로 선언하면 로드 순서와 무관하게 항상 이긴다.

### 레이어 2 — className (개별 조정)

모든 컴포넌트는 `className` prop을 받아 내부 클래스 뒤에 병합한다.

```tsx
<Button className="my-custom-class">저장</Button>
<Button className="rounded-full bg-red-500 px-8">Tailwind로 직접 조정</Button>
```

내부 스타일 규칙은 전부 클래스 1개 수준의 specificity(`(0,1,0)`)로 맞춰져 있다. CSS Modules 해시 클래스든 attribute selector(`[data-variant='solid']` 등)든 마찬가지다. 소비자의 클래스도 같은 specificity 1개짜리라 **동점**이 되고, CSS는 동점일 때 문서에 나중에 실린 스타일시트를 채택한다. 라이브러리를 먼저 import하고 자기 CSS(전역 스타일, Tailwind 산출물 등)를 그 뒤에 로드하는 일반적인 앱 구조에서는 소비자 스타일시트가 항상 나중이라 실질적으로 항상 이긴다.

### 레이어 3 — 네이티브 props 통과 + asChild

모든 컴포넌트가 `forwardRef`를 쓰고 대응하는 네이티브 엘리먼트의 props를 전부 상속한 뒤 그대로 전달한다.

```tsx
<Button ref={btnRef} data-testid="save-button" aria-describedby="save-hint" onPointerDown={...} />
```

렌더 엘리먼트를 완전히 바꿔야 하면(예: 라우터 `Link`를 버튼처럼 보이게) `asChild`를 쓴다. `as` prop은 없다 — 자식 엘리먼트에 Button의 props와 스타일을 병합해 그대로 렌더링한다.

```tsx
import { Link } from 'react-router-dom'

<Button asChild>
  <Link to="/next">이동</Link>
</Button>
```

`asChild`의 자식은 반드시 React element 하나여야 한다(문자열이나 fragment는 불가).

## variant / size / colorScheme

컴포넌트 공통 API 축이다. 어떤 컴포넌트가 어떤 값을 지원하는지는 각 컴포넌트의 타입을 참고한다.

| 축 | 값 |
|---|---|
| `variant` | `solid` \| `outline` \| `ghost` \| `link` |
| `size` | `sm` \| `md` \| `lg` |
| `colorScheme` | `primary` \| `secondary` \| `danger` \| `warning` \| `success` (문자열이면 그 외 값도 타입 에러 없이 통과한다) |

```tsx
<Button variant="outline" size="lg" colorScheme="danger">삭제</Button>
```

### 커스텀 colorScheme

`colorScheme`은 다섯 가지 기본값 외에 임의의 문자열도 받는다. CSS에서 그 이름으로 `data-scheme` 슬롯을 정의해두면 그대로 동작한다.

```css
[data-scheme='brand'] {
  --uikit-scheme-solid-bg: #ff5722;
  --uikit-scheme-solid-bg-hover: #e64a19;
  --uikit-scheme-solid-bg-active: #d84315;
  --uikit-scheme-solid-fg: #ffffff;
  --uikit-scheme-outline-border: #ff5722;
  --uikit-scheme-outline-fg: #e64a19;
  --uikit-scheme-outline-bg-hover: #fff3ee;
  --uikit-scheme-ghost-fg: #e64a19;
  --uikit-scheme-ghost-bg-hover: #fff3ee;
  --uikit-scheme-focus-ring: #ff5722;
}
```

```tsx
<Button colorScheme="brand">커스텀 스킴</Button>
```

## 다크 모드

`data-theme="dark"`를 상위 엘리먼트(보통 `<html>` 또는 `<body>`)에 지정하면 모든 시맨틱 색상 별칭과 스킴 슬롯이 다크용 값으로 바뀐다. 컴포넌트 CSS는 라이트/다크 두 벌이 아니라 별칭만 참조하는 한 벌이다.

```html
<html data-theme="dark">
  ...
</html>
```

```tsx
document.documentElement.dataset.theme = 'dark' // 런타임 토글
```

## 알아둘 캐베어트 2가지

### 1. `font-family`의 specificity 동점은 로드 순서에 좌우된다

`font-family`만 예외적으로 specificity를 0으로 낮춰서(`:where(.button) { font-family: ... }`), 소비자가 일반 타입 선택자로 덮어쓸 수 있게 했다.

```css
button { font-family: 'Pretendard'; } /* specificity (0,0,1) > (0,0,0) — 항상 이긴다 */
```

그런데 소비자가 `*` 전체 선택자로 폰트를 바꾸면 이쪽도 specificity가 `(0,0,0)`이 되어 동점이 되고, 이 경우는 문서에 나중에 실린 스타일시트가 이긴다.

```css
* { font-family: 'Pretendard'; } /* :where(.button)과 동점 — 로드 순서로 결정됨, 예측 어려움 */
```

`font-family` 이외의 속성(색상, 간격 등)은 이 예외를 적용하지 않고 일반 specificity를 유지한다. 그중 `className`으로 덮어쓰는 속성들은 위 레이어 2에서 설명한 대로 "동점 + 나중에 로드"로 이기는 것이고, `font-family`만 진짜로 무조건 이기는 `(0,0,0)`이라는 점이 다르다.

### 2. breakpoint는 런타임에 오버라이드할 수 없다

미디어쿼리는 CSS 커스텀 프로퍼티(`var()`)를 읽지 못한다.

```css
@media (min-width: var(--uikit-bp-md)) { } /* 동작하지 않음 — 브라우저가 무시한다 */
```

그래서 breakpoint는 빌드 타임에 `postcss-custom-media`로 고정된 값(`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px)이며, 다른 토큰처럼 `:root`에서 재정의할 수 없다. 바꾸려면 라이브러리를 포크하거나, 해당 컴포넌트의 반응형 동작이 필요 없는 경우 직접 CSS로 미디어쿼리를 재작성해야 한다.

## 개발

```bash
pnpm install
pnpm test              # Vitest
pnpm build              # tsc --noEmit && vite build
pnpm storybook          # 컴포넌트 쇼케이스 + Foundation 토큰 문서
pnpm build-storybook
```

## 라이선스

MIT
