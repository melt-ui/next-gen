// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepMergeable = { [key: string]: any };

export function deepMerge<T extends DeepMergeable, U extends DeepMergeable>(
	target: T,
	source: U,
): T & U {
	const result: DeepMergeable = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			if (source[key] && typeof source[key] === "object") {
				if (result[key] && typeof result[key] === "object") {
					// Both are objects, recurse
					result[key] = deepMerge(result[key], source[key]);
				} else {
					// Source is object but target isn't, clone source
					result[key] = deepMerge({}, source[key]);
				}
			} else {
				// Source is a primitive, simply assign it
				result[key] = source[key];
			}
		}
	}

	return result as T & U;
}
