import {
  cloneElement,
  forwardRef,
  isValidElement,
  version,
  type AllHTMLAttributes,
  type CSSProperties,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from './cx'

export interface SlotProps extends AllHTMLAttributes<HTMLElement> {
  children?: ReactNode
}

type AnyProps = Record<string, unknown>

type RefCleanup = () => void

function setRef<T>(ref: Ref<T> | undefined, value: T | null): RefCleanup | void {
  if (typeof ref === 'function') {
    return ref(value) as RefCleanup | void
  } else if (ref) {
    ;(ref as MutableRefObject<T | null>).current = value
  }
}

/**
 * React 19는 ref 콜백이 반환한 값을 정리(cleanup) 함수로 취급해, 언마운트 시
 * 그 함수를 호출하고 콜백을 다시 null로 호출하지 않는다. 합성된 콜백도 같은
 * 규약을 지켜야 한다 — 그러지 않으면 새 스타일 ref의 cleanup이 사라진다.
 * 일부 ref만 cleanup을 반환하는 혼합 상황에서는, 합성 cleanup 실행 시
 * cleanup이 없는 ref들도 setRef(ref, null)로 직접 정리해준다.
 */
function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    const cleanups = refs.map((ref) => setRef(ref, node))

    if (cleanups.some((cleanup) => typeof cleanup === 'function')) {
      return () => {
        cleanups.forEach((cleanup, index) => {
          if (typeof cleanup === 'function') {
            cleanup()
          } else {
            setRef(refs[index], null)
          }
        })
      }
    }
  }
}

/**
 * React 19는 ref를 props에 담고, React 18은 엘리먼트에 직접 담는다.
 * 19에서 element.ref에 접근하면 deprecation 경고가 나므로 버전으로 분기한다.
 */
function getElementRef(element: ReactElement): Ref<unknown> | undefined {
  const major = Number.parseInt(version.split('.')[0], 10)
  if (major >= 19) {
    return (element.props as { ref?: Ref<unknown> }).ref
  }
  return (element as unknown as { ref?: Ref<unknown> }).ref
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps }

  for (const key of Object.keys(childProps)) {
    if (key === 'ref' || key === 'key') continue

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
