import { isFunction } from "./is.js";
import type { MaybeGetter } from "$lib/types.js";

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T, D extends T>(
	value: MaybeGetter<T>,
	defaultValue?: D,
): D extends undefined | null ? T : Exclude<T, undefined | null> | D {
	if (isFunction(value)) {
		const getter = value as () => T;
		const gotten = getter();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (gotten ?? defaultValue ?? gotten) as any;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (value ?? defaultValue ?? value) as any;
}
