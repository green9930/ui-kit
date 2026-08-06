import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react'
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

  // Slot(asChild)은 children으로 정확히 하나의 ReactElement만 받아야 한다.
  // `{spinner}{children}`처럼 JSX에 두 개의 형제 표현식을 나열하면, 로딩이
  // 아니어도 createElement가 [null, children] 배열을 children prop으로
  // 넘겨 isValidElement 검사가 깨진다. 따라서 항상 단일 값으로 합친다.
  const content = isLoading ? (
    <>
      <span className={styles.spinner} aria-hidden="true" />
      {children}
    </>
  ) : (
    children
  )

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
      {content}
    </Component>
  )
})
