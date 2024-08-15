export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;
export type Extracted<T> = T extends MaybeGetter<infer U> ? U : T extends Getter<infer U> ? U : T;

export type WithoutGetters<Obj extends Record<string, unknown>> = {
	[K in keyof Obj]: Obj[K] extends MaybeGetter<infer T> ? T : Obj[K];
};

export type ComponentProps<Obj extends Record<string, unknown>> = Omit<
	WithoutGetters<Obj>,
	`on${string}Change`
>;
