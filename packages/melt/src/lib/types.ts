import type { SvelteSet } from "svelte/reactivity";

export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;
export type Setter<T> = (value: T) => void;
export type Extracted<T> = T extends MaybeGetter<infer U> ? U : T extends Getter<infer U> ? U : T;
export type IterableProp<T> = SvelteSet<T> | MaybeGetter<Iterable<T> | undefined>;

export type WithoutGetters<Obj extends Record<string, unknown>> = {
	[K in keyof Obj]: Obj[K] extends MaybeGetter<infer T> ? T : Obj[K];
};

export type ComponentProps<Obj extends Record<string, unknown>> = Omit<
	WithoutGetters<Obj>,
	`on${string}Change`
>;

/**
 * If `Multiple` is true, it will be an `IterableProp`, which is a `SvelteSet` or a getter that returns an iterable.
 * If `Multiple` is false, it will be a `MaybeGetter`, which is a value or a getter that returns a value.
 * @template T - The type of values that can be selected
 * @template Multiple - Boolean flag indicating if multiple selection is enabled
 */
export type MaybeMultiple<T, Multiple extends boolean> = Multiple extends true
	? IterableProp<T>
	: MaybeGetter<T | undefined>;
