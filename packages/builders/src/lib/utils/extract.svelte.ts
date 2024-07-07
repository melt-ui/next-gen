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
