import type { MaybeGetter } from "$lib/types";
import { isGetter } from "./is";

export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, defaultValue: T): T;

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract(value: unknown, defaultValue?: unknown) {
	if (isGetter(value)) {
		const getter = value;
		const gotten = getter();
		if (gotten === undefined) return defaultValue;
		return gotten;
	}

	if (value === undefined) return defaultValue;
	return value;
}
