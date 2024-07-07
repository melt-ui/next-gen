import { isFunction } from "./is";
import type { Getter, MaybeGetter } from "$lib/types";

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T>(value: MaybeGetter<T>, defaultValue?: T): T {
	if (isFunction(value)) {
		const getter = value as Getter<T>;
		const gotten = getter();
		return gotten ?? defaultValue ?? gotten;
	}

	return value ?? defaultValue ?? value;
}

export type Extracted<T> = T extends MaybeGetter<infer U> ? U : T;

export type Expand<T> = T extends (...args: infer A) => infer R
	? (...args: Expand<A>) => Expand<R>
	: T extends infer O
		? { [K in keyof O]: O[K] }
		: never;

export type ExtractedAll<Obj extends Record<string, unknown>> = Expand<{
	readonly [Key in keyof Obj]: Obj[Key] extends MaybeGetter<infer U> ? U : Obj[Key];
}>;

export function extractAll<Obj extends Record<string, unknown>>(
	maybeObj: MaybeGetter<Obj>,
): ExtractedAll<Obj> {
	const result = {} as ExtractedAll<Obj>;

	const obj = $derived(extract(maybeObj));

	Object.entries(obj).forEach(([key, value]) => {
		const derived = $derived(extract(value));
		Object.defineProperty(result, key, {
			get: () => derived,
		});
	});

	return result;
}
