export type Brand<T, TBrand extends symbol> = T & {
  readonly [K in TBrand]: never;
};

export type Unbrand<T> = T extends Brand<infer U, any> ? U : T;

export type BrandedRecord<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};
