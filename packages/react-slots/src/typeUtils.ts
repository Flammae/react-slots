export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type Pretty<T> = {
  [K in keyof T]: T[K];
} & {};

export type NoInfer<T> = [T][T extends any ? 0 : never];
