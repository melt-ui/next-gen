export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;
export type Extracted<T> = T extends MaybeGetter<infer U> ? U : T extends Getter<infer U> ? U : T;
