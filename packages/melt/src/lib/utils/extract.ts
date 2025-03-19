import type { MaybeGetter } from "$lib/types";
import { isGetter } from "./is";

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T, D extends T>(
	value: MaybeGetter<T>,
	defaultValue?: D,
): D extends undefined | null ? T : Exclude<T, undefined | null> | D {
	if (isGetter(value)) {
		const getter = value;
		const gotten = getter();

		return (gotten ?? defaultValue ?? gotten) as any;
	}

	return (value ?? defaultValue ?? value) as any;
}
