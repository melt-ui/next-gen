import type { MaybeGetter } from "$lib/types.js";
import { isFunction } from "./is.js";

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T>(value: MaybeGetter<T>): T;

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T>(value: MaybeGetter<T | undefined>, defaultValue: T): T;

export function extract(value: unknown, defaultValue?: unknown) {
	const extracted = isFunction(value) ? value() : value;
	return extracted !== undefined ? extracted : defaultValue;
}
