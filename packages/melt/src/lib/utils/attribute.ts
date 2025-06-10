import type { ObjToString } from "./types";

type DataReturn<T> = T extends true ? "" : T extends false ? undefined : T;

export function dataAttr<T>(value: T): DataReturn<T> {
	return (value === true ? "" : value === false ? undefined : value) as DataReturn<T>;
}

type DisabledReturn<T> = T extends true ? true : undefined;
export function disabledAttr<V extends boolean>(value?: V): DisabledReturn<V> {
	return (value === true ? true : undefined) as DisabledReturn<V>;
}

export function styleAttr<T extends Record<string, string>>(value: T): ObjToString<T> {
	return Object.entries(value)
		.map(([key, value]) => `${key}: ${value};`)
		.join(" ") as ObjToString<T>;
}

/**
 * Generate a unique, safe ID attribute from a string using hash-based approach
 */
export function idAttr(value: string): string {
	if (!value || typeof value !== "string") {
		return "id-empty";
	}

	// Simple but effective hash function (djb2 algorithm)
	let hash = 5381;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) + hash + value.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Convert to positive number and then to base36 for compactness
	const hashStr = Math.abs(hash).toString(36);

	// Create readable prefix from original string
	let prefix = value
		.replace(/[^a-zA-Z0-9]/g, "")
		.toLowerCase()
		.slice(0, 8);

	// Ensure prefix starts with a letter
	if (!prefix || /^[0-9]/.test(prefix)) {
		prefix = "id" + prefix;
	}

	return `${prefix}-${hashStr}`;
}
