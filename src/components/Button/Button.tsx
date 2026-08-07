import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ElementType,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
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
  // asChild ? Slot : 'button' 은 유니온 타입이 되어, 아래 JSX에 props를 그대로
  // 스프레드하면 TS가 두 컴포넌트 타입을 동시에 만족하라고 요구한다.
  // ButtonProps는 정확한 공개 API로 남겨두고, 렌더 대상 선택만 로컬 구현
  // 세부사항으로 좁혀 ElementType으로 지정해 우회한다.
  const Component: ElementType = asChild ? Slot : 'button'
  const isDisabled = disabled || isLoading

  // asChild일 때 렌더 대상은 button이 아닐 수 있으므로 button 전용 속성을 넘기지 않는다.
  const buttonOnlyProps = asChild
    ? {}
    : { type: type ?? 'button', disabled: isDisabled }

  // asChild + isDisabled(disabled 또는 isLoading)일 때는 button의 disabled 속성을
  // 쓸 수 없다(자식이 button이 아닐 수 있으므로). aria-disabled/data-disabled는
  // 스크린리더/CSS에만 알릴 뿐 클릭·키보드 활성화를 막지 않으므로, 탭 순서에서
  // 빼고 capture 단계에서 클릭 자체를 삼켜 자식 자신의 핸들러와 소비자가 넘긴
  // onClick 모두를 막는다. isLoading 단독일 때도 막아야 한다 — isLoading은 진행
  // 중인 비동기 액션의 중복 제출을 막기 위한 것이고, aria-disabled/data-disabled가
  // 이미 비활성으로 알리는 것과 실제 클릭 가능 여부가 같은 렌더 안에서 어긋나면
  // 안 된다(native button은 disabled 속성 하나로 이 둘이 항상 같이 간다).
  // pointer-events는 건드리지 않는다 — Tooltip이 비활성 버튼 위에 붙을 수 있어야 한다.
  const disabledAsChildProps =
    asChild && isDisabled
      ? {
          tabIndex: -1,
          onClickCapture: (event: MouseEvent) => {
            event.preventDefault()
            event.stopPropagation()
          },
        }
      : {}

  const spinner = isLoading ? (
    <span className={styles.spinner} aria-hidden="true" />
  ) : null

  // Slot(asChild)은 children으로 정확히 하나의 ReactElement를 받아야 클론할 수 있다.
  // isLoading일 때 무조건 Fragment로 감싸면 asChild 경로에서 Slot이 Fragment를
  // 클론하게 되고, React는 Fragment에 children 이외의 prop을 전부 버린다 — 그
  // 결과 자식의 class, data-*, ref, onClick이 전부 사라지고 console에 "Invalid
  // prop supplied to React.Fragment" 경고가 뜬다. 그래서 asChild + isLoading일
  // 때는 스피너를 자식 "안쪽"에 주입해 자식 자체를 여전히 단일 엘리먼트로 유지한다.
  let content: ReactNode
  if (asChild) {
    if (isLoading && isValidElement(children)) {
      const child = children as ReactElement<{ children?: ReactNode }>
      content = cloneElement(child, undefined, spinner, child.props.children)
    } else {
      content = children
    }
  } else {
    content = (
      <>
        {spinner}
        {children}
      </>
    )
  }

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
      {...disabledAsChildProps}
    >
      {content}
    </Component>
  )
})
