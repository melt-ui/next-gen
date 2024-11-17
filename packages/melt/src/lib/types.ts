export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;
export type Setter<T> = (value: T) => void;
export type Extracted<T> = T extends Getter<infer U> ? U : T;

export type ComponentProps<T> = {
	[K in keyof T]: Extracted<T[K]>;
};
