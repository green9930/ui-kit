# UI Kit 설계

날짜: 2026-08-05
패키지: `@green9930/ui-kit`

## 목적

여러 사이드 프로젝트에서 재사용할 React UI 컴포넌트 킷. npm에 공개 배포하고, 소비하는 프로젝트가 어떤 스타일링 스택을 쓰든 제약 없이 커스터마이징할 수 있어야 한다.

## 이 스펙의 범위

**Foundation(디자인 토큰)과 전 컴포넌트 공통 규약까지만** 다룬다. 컴포넌트 구성안은 Tier 1~4에 걸쳐 100개가 넘어 단일 스펙으로 감당할 수 없다. 컴포넌트는 Tier 순서대로 진행하며, 각 컴포넌트마다 변수화할 항목 목록을 제안하고 선택받는 방식으로 별도 사이클을 돈다.

## 핵심 제약

소비 측 자유도가 최우선 목표다. 설계 전반이 여기서 도출된다.

- 소비 프로젝트에 특정 스타일링 라이브러리(Tailwind 등)를 강제하지 않는다.
- 소비자가 CSS import 없이 바로 쓸 수 있다.
- Tier 1~3은 런타임 의존성 0. React만 peer dependency.
- Tier 4의 무거운 컴포넌트(RichTextEditor, Chart 래퍼, DatePicker)는 외부 의존성이 불가피하므로 별도 서브패키지(`@green9930/ui-kit-editor` 등)로 분리해 코어를 가볍게 유지한다. Tier 4 진입 시점에 확정한다.

## 커스터마이징 3레이어

### 레이어 1 — 토큰 오버라이드 (전역 테마)

```css
:root {
  --uikit-color-primary-600: #ff5722;
  --uikit-radius-md: 12px;
}
```

토큰은 `:where(:root)`에 정의한다. `:where()`의 specificity가 0이므로 소비자가 평범한 `:root {}`로 선언하면 항상 이긴다.

이 레이어가 성립하려면 **컴포넌트 CSS에 하드코딩된 값이 하나도 없어야 한다**. 색상, 간격, radius, 폰트 크기, 그림자, transition 전부 토큰 변수를 참조한다. 이 규칙을 어기면 해당 속성만 소비자가 테마로 바꿀 수 없게 되고, 나중에 발견하기 어렵다.

예외는 breakpoint 하나뿐이다 (아래 참조).

### 레이어 2 — className (개별 조정)

```jsx
<Button className="my-custom" />        // Tailwind, CSS Modules, 일반 CSS 모두 동작
```

모든 컴포넌트는 `className` prop을 받아 내부 클래스 뒤에 병합한다. CSS Modules의 해시 클래스는 단일 클래스 selector라 specificity가 낮아, 소비자 클래스가 확실히 덮어쓴다.

### 레이어 3 — 네이티브 props 통과 + asChild

```jsx
<Button ref={btnRef} data-testid="x" aria-describedby="y" onPointerDown={...} />
<Button asChild><Link to="/x">이동</Link></Button>
```

모든 컴포넌트가 `forwardRef`를 쓰고 대응하는 네이티브 엘리먼트의 props를 전부 상속(`ComponentPropsWithoutRef<'button'>`)한 뒤 `...rest`로 전달한다.

## Foundation — 디자인 토큰

모든 변수는 `--uikit-` 접두사를 쓴다. 값은 `src/styles/tokens.css`에 정의한다.

### 색상 팔레트

각 스킴은 50~900의 10단계 스케일을 갖는다. 값은 대비 검증이 된 공개 팔레트(Tailwind의 slate/blue/red/amber/green)를 기준으로 삼았다. 색상 자체가 이 프로젝트의 차별점이 아니고, 접근성 대비가 이미 검증된 값을 쓰는 편이 안전하다.

| 스텝 | gray | primary | danger | warning | success |
|---|---|---|---|---|---|
| 50 | `#F8FAFC` | `#EFF6FF` | `#FEF2F2` | `#FFFBEB` | `#F0FDF4` |
| 100 | `#F1F5F9` | `#DBEAFE` | `#FEE2E2` | `#FEF3C7` | `#DCFCE7` |
| 200 | `#E2E8F0` | `#BFDBFE` | `#FECACA` | `#FDE68A` | `#BBF7D0` |
| 300 | `#CBD5E1` | `#93C5FD` | `#FCA5A5` | `#FCD34D` | `#86EFAC` |
| 400 | `#94A3B8` | `#60A5FA` | `#F87171` | `#FBBF24` | `#4ADE80` |
| 500 | `#64748B` | `#3B82F6` | `#EF4444` | `#F59E0B` | `#22C55E` |
| 600 | `#475569` | `#2563EB` | `#DC2626` | `#D97706` | `#16A34A` |
| 700 | `#334155` | `#1D4ED8` | `#B91C1C` | `#B45309` | `#15803D` |
| 800 | `#1E293B` | `#1E40AF` | `#991B1B` | `#92400E` | `#166534` |
| 900 | `#0F172A` | `#1E3A8A` | `#7F1D1D` | `#78350F` | `#14532D` |

`secondary`는 별도 hue를 만들지 않고 `gray` 스케일에 매핑한다. 중립적인 대안 액션이라는 의미에 맞고, 관리할 팔레트가 하나 줄어든다.

**solid 배경의 대비 처리** — 스킴마다 흰 텍스트로 4.5:1을 넘기는 스텝이 다르다. primary와 danger는 600, success는 700을 solid 배경으로 쓴다. warning은 어떤 스텝에서도 흰 텍스트가 대비를 만족하지 못하므로 **solid 전경색을 `gray-900`으로 둔다**. 이 차이는 스킴 슬롯(아래)에서 흡수되므로 컴포넌트는 신경 쓰지 않는다.

### 시맨틱 별칭 (라이트/다크 대응)

컴포넌트는 팔레트 스텝을 직접 참조하지 않고 아래 별칭을 쓴다. 다크모드는 `[data-theme="dark"]`에서 같은 별칭을 재정의하므로 컴포넌트 CSS는 한 벌만 존재한다.

| 별칭 | light | dark |
|---|---|---|
| `--uikit-color-bg` | `white` | `gray-900` |
| `--uikit-color-surface` | `white` | `gray-800` |
| `--uikit-color-surface-subtle` | `gray-50` | `gray-800` |
| `--uikit-color-fg` | `gray-900` | `gray-50` |
| `--uikit-color-fg-muted` | `gray-500` | `gray-400` |
| `--uikit-color-border` | `gray-200` | `gray-700` |
| `--uikit-color-border-strong` | `gray-300` | `gray-600` |
| `--uikit-color-focus-ring` | `primary-500` | `primary-400` |
| `--uikit-color-disabled-bg` | `gray-100` | `gray-800` |
| `--uikit-color-disabled-fg` | `gray-400` | `gray-600` |

### 스킴 슬롯 — `colorScheme`을 가능하게 하는 간접 참조

컴포넌트 CSS가 `--uikit-color-primary-600`을 직접 참조하면 `colorScheme="danger"`로 바꿀 수 없다. 컴포넌트는 **슬롯만** 참조하고, 슬롯의 실제 값은 `data-scheme` 속성이 주입한다.

```css
/* 컴포넌트 — 슬롯만 참조한다 */
.button { background: var(--uikit-scheme-solid-bg); color: var(--uikit-scheme-solid-fg); }
.button:hover { background: var(--uikit-scheme-solid-bg-hover); }

/* 스킴 정의 — 슬롯에 팔레트를 주입한다 */
[data-scheme="primary"] {
  --uikit-scheme-solid-bg: var(--uikit-color-primary-600);
  --uikit-scheme-solid-bg-hover: var(--uikit-color-primary-700);
  --uikit-scheme-solid-fg: white;
  /* ... */
}
```

정의하는 슬롯은 다음과 같다. variant 축(solid/outline/ghost/link)을 모두 커버한다.

- solid: `solid-bg`, `solid-bg-hover`, `solid-bg-active`, `solid-fg`
- subtle: `subtle-bg`, `subtle-bg-hover`, `subtle-fg`
- outline: `outline-border`, `outline-fg`, `outline-bg-hover`
- ghost: `ghost-fg`, `ghost-bg-hover`
- 공통: `scheme-focus-ring`

이 구조 덕에 새 colorScheme 추가가 CSS 블록 하나로 끝나고, 소비자도 자기 스킴을 정의해 쓸 수 있다.

기본 제공 스킴은 `primary`, `secondary`, `danger`, `warning`, `success`다.

### 타이포그래피

```
--uikit-font-family: -apple-system, BlinkMacSystemFont, 'Pretendard Variable',
                     Pretendard, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif
--uikit-font-family-mono: 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

폰트 파일은 번들하지 않는다. 시스템 스택으로 두고 소비자가 `--uikit-font-family`를 덮어쓴다. 한글 폰트가 흔히 쓰이는 환경이라 Pretendard와 Apple SD Gothic Neo를 폴백에 포함하되, 설치되어 있지 않으면 자연스럽게 다음 폰트로 넘어간다.

크기는 `rem` 기준이다. 사용자가 브라우저 기본 글자 크기를 키웠을 때 따라 커져야 하므로 `px`를 쓰지 않는다.

| 토큰 | 값 | | 토큰 | 값 |
|---|---|---|---|---|
| `font-size-xs` | 0.75rem (12px) | | `font-weight-normal` | 400 |
| `font-size-sm` | 0.875rem (14px) | | `font-weight-medium` | 500 |
| `font-size-md` | 1rem (16px) | | `font-weight-semibold` | 600 |
| `font-size-lg` | 1.125rem (18px) | | `font-weight-bold` | 700 |
| `font-size-xl` | 1.25rem (20px) | | `line-height-tight` | 1.25 |
| `font-size-2xl` | 1.5rem (24px) | | `line-height-snug` | 1.375 |
| `font-size-3xl` | 1.875rem (30px) | | `line-height-normal` | 1.5 |
| `font-size-4xl` | 2.25rem (36px) | | `line-height-relaxed` | 1.625 |

letter-spacing: `tight` -0.02em, `normal` 0, `wide` 0.02em.

### 간격

4px 기반 스케일. `rem`으로 정의한다.

| 토큰 | 값 | 토큰 | 값 |
|---|---|---|---|
| `space-0` | 0 | `space-6` | 1.5rem (24px) |
| `space-1` | 0.25rem (4px) | `space-8` | 2rem (32px) |
| `space-2` | 0.5rem (8px) | `space-10` | 2.5rem (40px) |
| `space-3` | 0.75rem (12px) | `space-12` | 3rem (48px) |
| `space-4` | 1rem (16px) | `space-16` | 4rem (64px) |
| `space-5` | 1.25rem (20px) | | |

### 컨트롤 높이

`size` 3단계를 height로 구분하므로 컨트롤 전용 토큰을 따로 둔다. Button, IconButton, Input, Select 등 인터랙티브 컨트롤이 공유해서 나란히 놓았을 때 높이가 정확히 맞는다.

| 토큰 | 값 |
|---|---|
| `control-height-sm` | 2rem (32px) |
| `control-height-md` | 2.5rem (40px) |
| `control-height-lg` | 3rem (48px) |

### radius / border / shadow

| radius | 값 | | border-width | 값 |
|---|---|---|---|---|
| `radius-none` | 0 | | `border-width-thin` | 1px |
| `radius-sm` | 4px | | `border-width-thick` | 2px |
| `radius-md` | 6px | | | |
| `radius-lg` | 8px | | | |
| `radius-xl` | 12px | | | |
| `radius-full` | 9999px | | | |

shadow는 4단계다.

| 토큰 | 값 |
|---|---|
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` |

다크모드에서는 그림자가 어두운 배경에 묻히므로 `[data-theme="dark"]`에서 불투명도를 `0.4`~`0.6` 수준으로 높인 값으로 재정의한다.

### z-index 레이어

| 토큰 | 값 | 토큰 | 값 |
|---|---|---|---|
| `z-base` | 0 | `z-modal` | 1300 |
| `z-dropdown` | 1000 | `z-popover` | 1400 |
| `z-sticky` | 1100 | `z-toast` | 1500 |
| `z-overlay` | 1200 | `z-tooltip` | 1600 |

구성안에 없던 `overlay`와 `tooltip`을 추가했다. overlay는 모달 배경 딤이 모달 본체보다 아래에 있어야 해서 필요하고, tooltip은 모달이나 팝오버 안의 요소에도 뜰 수 있어야 하므로 최상단에 둔다.

### breakpoint

| 이름 | 값 |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

**breakpoint만 CSS 커스텀 프로퍼티로 만들 수 없다.** 미디어쿼리는 `var()`를 해석하지 못한다.

```css
@media (min-width: var(--uikit-bp-md)) { }   /* 동작하지 않음 */
```

따라서 `postcss-custom-media`(빌드 타임 devDependency)로 `@custom-media --uikit-md (min-width: 768px);`를 `src/styles/media.css`에 선언하고 컴포넌트 CSS에서 `@media (--uikit-md)`로 참조한다.

`postcss-custom-media`는 v10에서 `importFrom` 옵션이 제거되어, 선언을 각 CSS 파일에 직접 넣지 않으면 해석하지 못한다. `@csstools/postcss-global-data`를 앞단에 두고 `media.css`를 전역 데이터로 주입해 컴포넌트 CSS마다 import하지 않아도 되게 한다. 두 플러그인의 순서(global-data → custom-media)가 중요하다.

정의는 한 곳에 모이고 런타임 비용은 없다. 대신 이 값만은 소비자가 CSS 변수로 덮어쓸 수 없으며, 바꾸려면 미디어쿼리를 직접 재작성해야 한다. 이 제약을 README에 명시한다.

### motion

| duration | 값 | | easing | 값 |
|---|---|---|---|---|
| `duration-instant` | 50ms | | `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `duration-fast` | 150ms | | `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `duration-normal` | 200ms | | `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `duration-slow` | 300ms | | `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

등장에는 `ease-out`, 퇴장에는 `ease-in`을 쓴다. `prefers-reduced-motion: reduce`에서 모든 duration 토큰을 `0.01ms`로 재정의해 한 곳에서 전역 차단한다.

## 반응형 전략

CSS 내부에서 처리한다. 컴포넌트 prop은 `size="md"` 같은 단일 값만 받고, breakpoint별 값을 객체로 받는 API는 만들지 않는다. 런타임 CSS 변수 주입과 복잡한 제네릭 타입을 피할 수 있다.

- 폭이 가변인 컴포넌트는 `width: 100%`로 부모를 채운다. `max-width`를 컴포넌트가 직접 정하지 않는다.
- `min-width`가 필요한 경우 **임의로 정하지 않고 사용자에게 물어본 뒤 설정한다.**
- 크기 단계가 breakpoint에 따라 달라져야 하면 컴포넌트 CSS 내부의 미디어쿼리로 처리한다.

타입은 `ResponsiveValue<T>`를 열어두지 않는다. 필요해지면 그때 별도 사이클로 도입한다.

## 전 컴포넌트 공통 API 규약

### variant 축

각 컴포넌트가 어떤 축을 갖는지는 컴포넌트별 사이클에서 표로 관리한다. 축 자체의 정의는 다음으로 고정한다.

| 축 | 값 |
|---|---|
| `variant` | `solid` \| `outline` \| `ghost` \| `link` |
| `size` | `sm` \| `md` \| `lg` |
| `colorScheme` | `primary` \| `secondary` \| `danger` \| `warning` \| `success` |
| 상태 boolean | `disabled`, `invalid`, `loading`, `readOnly`, `required` |

### 상태별 디자인

상태를 갖는 컴포넌트는 해당하는 모든 상태의 스타일을 정의한다. 하나라도 빠지면 완료로 보지 않는다.

`default` / `hover` / `active` / `focus-visible` / `disabled` / `invalid`(error) / `readOnly` / `loading` / `checked`·`selected`

`focus`가 아니라 `focus-visible`을 쓴다. 마우스 클릭에는 포커스 링이 뜨지 않고 키보드 탐색에만 뜬다. `outline: none`으로 포커스 링을 제거하지 않는다.

### 제어 방식

상태를 갖는 컴포넌트는 `value`/`defaultValue` + `onChange` 쌍으로 controlled와 uncontrolled를 동시에 지원한다. `value`가 `undefined`가 아니면 controlled로 동작한다. boolean 상태는 `checked`/`defaultChecked`, 열림 상태는 `open`/`defaultOpen`을 쓴다.

### ref와 props

전부 `forwardRef`. 대응하는 네이티브 엘리먼트의 props를 상속하고 `...rest`를 스프레드한다.

### asChild

렌더 엘리먼트 교체는 `asChild` 하나로 통일한다. `as` prop은 쓰지 않는다.

```jsx
<Button asChild><Link to="/x">이동</Link></Button>
```

`Slot` 유틸을 `src/utils/Slot.tsx`에 구현한다. 자식 엘리먼트를 `cloneElement`하며 props를 병합하고, `className`은 이어붙이고, `ref`는 합성하고, 이벤트 핸들러는 둘 다 호출한다. Tier 1 첫 컴포넌트보다 먼저 만들어야 한다.

### 접근성

- 키보드 인터랙션: Esc(닫기), 화살표(목록 이동), Tab 트랩(모달), Enter/Space(활성화)
- 적절한 role과 aria 속성. 네이티브 엘리먼트로 해결되면 네이티브를 쓴다.
- 폼 컴포넌트는 `useId`로 label ↔ control ↔ description/error를 `htmlFor`, `aria-describedby`, `aria-invalid`로 자동 연결한다. 소비자가 `id`를 넘기면 그것을 우선한다.

## 쇼케이스

Storybook(`@storybook/react-vite`)에 토큰 라이브 패널을 붙인다. 별도 문서 사이트는 만들지 않는다.

- Foundation 전용 Docs 페이지 — 색상 팔레트, 타이포 스케일, 간격, radius/shadow, z-index, motion을 시각적으로 나열
- **토큰 라이브 패널** — Storybook 툴바에서 주요 토큰(primary 색상, radius, font-family, 폰트 크기 배율)을 조절하면 preview iframe의 `:root`에 CSS 변수를 주입한다. 모든 컴포넌트 스토리에 즉시 반영되므로, Foundation과 컴포넌트가 분리되어 보이지 않는다.
- 라이트/다크 토글 — `[data-theme]`을 preview 루트에 토글
- 컴포넌트 스토리에서 폭이 가변인 것들은 컨테이너를 **480px 고정**으로 감싸 검토하기 좋게 한다. Storybook 데코레이터로 공통 적용한다.
- `@storybook/addon-a11y`로 각 스토리의 접근성 위반을 확인한다.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | React 18+ (peer dependency) |
| 언어 | TypeScript |
| 빌드 | Vite library mode |
| 스타일링 | CSS Modules + CSS 커스텀 프로퍼티 + postcss-custom-media |
| 문서화 | Storybook (`@storybook/react-vite`) + a11y 애드온 |
| 테스트 | Vitest + Testing Library + jsdom |
| 패키지 매니저 | pnpm 9.2.0 (개발), npm 레지스트리 (배포) |

레지스트리와 패키지 매니저는 독립적이다. npm 레지스트리에 publish하면 소비 측은 pnpm/npm/yarn/bun 무엇이든 설치할 수 있으며 별도 설정이 필요 없다.

## 디렉토리 구조

```
ui-kit/
├── .storybook/
│   ├── main.ts
│   ├── preview.tsx          토큰 라이브 패널 데코레이터, 480px 데코레이터
│   └── Foundation.mdx       Foundation Docs 페이지
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       ├── Button.test.tsx
│   │       ├── Button.stories.tsx
│   │       └── index.ts
│   ├── styles/
│   │   ├── palette.css      50~900 팔레트 스케일
│   │   ├── semantic.css     시맨틱 별칭 + 다크모드
│   │   ├── schemes.css      data-scheme 슬롯 정의
│   │   ├── tokens.css       간격·타이포·radius·shadow·z·motion, 위 3개를 import
│   │   ├── media.css        @custom-media breakpoint 선언
│   │   └── reset.css        컴포넌트 한정 최소 리셋
│   ├── utils/
│   │   ├── cx.ts            클래스명 결합
│   │   └── Slot.tsx         asChild 구현
│   ├── types.ts             Size, Variant, ColorScheme 공통 타입
│   └── index.ts
├── .npmrc
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

컴포넌트 하나가 폴더 하나이고 파일 5개(구현, 스타일, 테스트, 스토리, 배럴)로 고정된다. 컴포넌트끼리 서로를 import하지 않으므로 각각 독립적으로 읽고, 수정하고, 테스트할 수 있다. 단 Tier 3부터는 Tier 1 컴포넌트를 조합하므로 하위 Tier 방향으로만 import한다.

## 빌드 설정

- **출력 포맷**: ESM 단독. 소비처가 Vite/Next 기반이라 CJS는 불필요.
- **타입**: `vite-plugin-dts`로 `.d.ts` 생성.
- **CSS 주입**: `vite-plugin-lib-inject-css` + rollup `preserveModules: true`. 각 컴포넌트 JS가 자기 CSS를 스스로 import하므로 소비자는 CSS를 별도로 import하지 않으며, 사용하지 않은 컴포넌트는 JS와 CSS 모두 트리셰이킹된다.
- **external**: `react`, `react-dom`, `react/jsx-runtime`.
- **peerDependencies**: `react >=18`, `react-dom >=18`.
- **package.json**: `"type": "module"`, `"sideEffects": ["*.css"]`, `"packageManager": "pnpm@9.2.0"`.

토큰 CSS는 컴포넌트와 별개로 항상 필요하므로 `src/index.ts`에서 `styles/tokens.css`를 import해 진입점에 항상 포함시킨다.

`.npmrc`에 `auto-install-peers=true`를 설정한다. pnpm의 격리된 node_modules 구조에서 Storybook 애드온이 peer dependency를 해석하지 못하는 문제를 예방한다.

## 테스트 전략

Vitest + Testing Library + jsdom. 컴포넌트마다 다음을 검증한다.

1. 기본 렌더링과 children 반영
2. `variant` / `size` / `colorScheme` prop이 클래스와 `data-scheme`에 반영되는지
3. 이벤트 핸들러 호출
4. `ref` 전달
5. `className`이 내부 클래스와 함께 병합되는지
6. `asChild`로 자식 엘리먼트에 props가 병합되는지
7. 상태형 컴포넌트는 controlled/uncontrolled 양쪽 동작
8. 폼 컴포넌트는 label ↔ control aria 연결
9. 키보드 인터랙션(해당하는 경우)

CSS 값 자체의 시각적 검증은 Storybook과 a11y 애드온에 맡긴다. 시각 회귀 테스트는 도입하지 않는다.

## 로드맵

Foundation → Tier 순서로 진행한다. 각 Tier는 별도 스펙과 계획 사이클을 갖는다.

**Foundation (이 스펙)** — 토큰, 공통 규약, 빌드 파이프라인, Storybook 쇼케이스, `Slot`/`cx` 유틸

**Tier 1 — Primitives**
Action: Button, IconButton, ButtonGroup, Link, CopyButton
Form: Input, Textarea, Label, HelperText, ErrorMessage, Checkbox, Radio, Switch
표시: Text, Heading, Badge, Tag/Chip, Avatar, Icon, Code, Kbd
상태: Spinner, ProgressBar, Skeleton, Divider
유틸: Image, AspectRatio, VisuallyHidden, Portal

**Tier 2 — Layout**
Box, Stack(VStack/HStack), Flex, Grid, Container, Center, Spacer, ScrollArea, Sticky, Resizable/SplitPane(선택)

**Tier 3 — Composites**
폼 조합: FormField, InputGroup, SearchInput, PasswordInput, NumberInput, CheckboxGroup, RadioGroup, SegmentedControl
선택: Select, Combobox/Autocomplete, MultiSelect, TagInput
범위/값: Slider, RangeSlider, Rating, ColorPicker, TimePicker
파일: FileUpload, Dropzone, FilePreview
오버레이: Tooltip, Popover, DropdownMenu
내비게이션: Tabs, Breadcrumb, Pagination, Steps
컨테이너: Card, Accordion/Collapsible, Alert/Callout, AvatarGroup
피드백: Toast(+ToastProvider), Snackbar

**Tier 4 — Complex**
Modal/Dialog, AlertDialog, Drawer/Sheet, Table/DataTable, Carousel, Calendar/DatePicker/DateRangePicker, CommandPalette, Navbar/Header, Sidebar/SideNav, TreeView, Timeline, Kanban/Sortable List, RichTextEditor, Chart 래퍼, EmptyState, ErrorBoundary Fallback, NotFound

Select는 Tier 1이 아니라 Tier 3에 있다. 네이티브 `<select>`로는 Combobox/MultiSelect와 API를 맞출 수 없으므로 선택 계열을 한 사이클에서 함께 설계한다.

## 배포

```
pnpm build          # dist 생성
pnpm test           # Vitest
npm version patch   # 버전 증가 + 태그
npm publish --access public
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
- Tier 4 무거운 컴포넌트의 서브패키지 분리 방식은 Tier 4 진입 시점에 확정한다.
- `min-width`가 필요한 컴포넌트가 나올 때마다 값을 사용자에게 확인한다.
