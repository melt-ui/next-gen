import type { ValueOf } from "./types";

/** Strongly typed Object.keys */
export function keys<T extends object>(obj: T): Array<keyof T> {
	return Object.keys(obj) as Array<keyof T>;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	...keys: K[]
): Omit<T, K> {
	const result = {} as Omit<T, K>;
	for (const key of Object.keys(obj)) {
		if (!keys.includes(key as unknown as K)) {
			result[key as keyof Omit<T, K>] = obj[key] as ValueOf<Omit<T, K>>;
		}
	}
	return result;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	...keys: K[]
): Pick<T, K> {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		result[key] = obj[key] as ValueOf<Pick<T, K>>;
	}
	return result;
}
