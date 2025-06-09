export type Nullable<T> = T | null | undefined;

export type PositiveNumber<T extends number> = T extends number
  ? `${T}` extends `-${string}`
    ? never
    : T extends 0
      ? never
      : T
  : never;
