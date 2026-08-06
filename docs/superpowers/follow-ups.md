# 이월 항목

Foundation + Button 사이클(2026-08-05)의 리뷰에서 나왔지만 그 사이클에서 고치지
않기로 한 것들. 각 항목에 왜 미뤘는지와 언제 처리해야 하는지를 적는다.

## Tier 1 두 번째 컴포넌트 전에 처리

### `composeRefs`가 매 렌더 재생성된다

`src/utils/Slot.tsx`. `composeRefs(...)`가 렌더마다 새 클로저를 만들어 React가 ref를
detach/reattach한다. React 19에서는 소비자가 cleanup을 반환하는 ref 콜백을 썼을 때
부모가 리렌더될 때마다 cleanup이 실행되고 setup이 다시 돈다.

구체적 실패: 폼 안에서 `<Button asChild><a ref={node => { if (!node) return;
const o = new IntersectionObserver(cb); o.observe(node); return () => o.disconnect() }}>`
를 쓰면 키 입력마다 옵저버가 끊기고 다시 만들어진다.

`useCallback`으로 메모이즈하면 되지만 현재 `isValidElement` 조기 반환이 훅보다
앞에 있어 구조를 바꿔야 한다. `Slot`은 모든 `asChild`가 통과하는 지점이라 두 번째
`asChild` 컴포넌트가 나오기 전에 고친다.

## 편할 때 처리

### `disabledAsChildProps`가 `mergeProps`를 거치지 않는다

`src/components/Button/Button.tsx`. 직접 스프레드되고 위치가 마지막이라 소비자가
넘긴 `onClickCapture`와 `tabIndex`를 체이닝하지 않고 덮어쓴다. 같은 JSX 블록에서
`{...rest}`는 소비자가 이기도록 `data-*` 뒤에 두고 있어 규칙이 어긋난다.

### 테스트 공백 두 가지

- `ClassValue`가 `number`를 포함하는데 숫자 인자를 넣는 테스트가 없다. 동작은
  올바르고 clsx와 같다(`0`은 falsy로 걸러짐).
- ref cleanup 테스트가 "cleanup 반환 ref 하나 + 일반 ref 하나"만 커버한다.
  "둘 다 cleanup 반환" 조합은 코드 추적으로만 확인됐다. 동작은 정상이고 커버리지
  문제다.

### `readOverrides`의 shape 검증

`.storybook/tokenControl.ts`. 최종 픽스에서 가드를 넣었으므로 해결됐지만, 같은
패턴을 다른 개발 도구 코드에 복사할 때 주의한다.

## 결정이 필요한 것

### `Slot`과 `cx`를 공개 API로 export할지

`dist/utils/Slot.js`와 `dist/utils/cx.js`가 빌드되어 배포되지만 `exports` 맵으로
도달할 수 없다. 자기만의 `asChild` 래퍼를 만들려는 소비자는 `Slot`을 원할 수 있다.
공개하면 영구적인 API 표면이 되므로 의도적으로 결정한다.

### `font-family`의 `:where()` 선언 반복

컴포넌트 스타일시트마다 `:where(.x) { font-family: var(--uikit-font-family, inherit) }`
를 손으로 반복해야 하고 강제하는 장치가 없다. 컴포넌트가 스무 개로 늘기 전에 공유
partial을 `@import`하거나 린트 규칙을 두는 편이 낫다.

### `ElementType` 캐스트가 타입 체크를 끈다

`src/components/Button/Button.tsx`의 `const Component: ElementType`은 `asChild`
분기의 유니온 타입 문제를 피하는 데 필요하지만, 반환되는 JSX 전체의 prop 타입 검사를
끈다. `data-schemee`나 `aria-buzy` 같은 오타가 컴파일을 통과한다. 같은 패턴을 쓸
컴포넌트가 많으므로 대안이 있는지 한 번 검토한다.

## 처리하지 않기로 한 것

### `engines` 필드

Node 하한은 `vitest`/`jsdom` 같은 devDependency에서 온다. `engines`는 **소비자**를
제약하는데 이 패키지는 Node 런타임 요구가 없는 브라우저 코드다. 추가하면 구형 Node로
번들러를 돌리는 사람에게 근거 없는 경고만 낸다. 개발 환경을 고정하려면 `.nvmrc`를 쓴다.

### `text-decoration-thickness: 2px`

하드코딩 금지 제약의 예외 목록에 명시되지 않았지만, `outline-width`나
`text-underline-offset`과 같은 범주의 1~2px 장식 상수이고 테마화 가치가 없다.
토큰으로 만들면 노이즈만 는다.

### Button의 non-`asChild` 분기가 항상 Fragment로 감싼다

스피너가 `null`일 때도 감싸지만 React가 알아서 처리한다. 기능상 no-op이라 손대지 않는다.
