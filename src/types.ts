export type Size = 'sm' | 'md' | 'lg'

/**
 * 기본 제공 스킴 5종은 자동완성을 위해 그대로 두고, 나머지는 `string`으로 열어둔다.
 * 소비자가 `[data-scheme="brand"] { --uikit-scheme-*: ... }`로 자기 스킴을 정의해
 * `colorScheme="brand"`처럼 쓰는 것이 런타임에서는 이미 동작하므로(스펙 참조),
 * 타입에서 막을 이유가 없다. `string`과의 유니온이라 IDE 자동완성에서 리터럴이
 * 사라지지 않도록 `(string & {})`로 감싼다 — 단순 `string`이면 TS가 유니온을
 * `string`으로 뭉개버려 5종 제안이 없어진다.
 */
export type ColorScheme =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'
  | (string & {})

export type Variant = 'solid' | 'outline' | 'ghost' | 'link'
