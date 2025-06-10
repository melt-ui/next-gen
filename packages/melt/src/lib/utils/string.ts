export function unique(value: unknown, seen = new WeakMap()): string {
	// Handle primitives
	if (value === null) return "null";
	if (typeof value !== "object") {
		if (typeof value === "bigint") return `bigint:${value}`;
		if (typeof value === "symbol") return `symbol:${value.toString()}`;
		if (typeof value === "function") return `function:${value.toString()}`;
		if (Number.isNaN(value)) return "NaN";
		return `${typeof value}:${value}`;
	}

	// Handle circular references
	if (seen.has(value)) return "[Circular]";
	seen.set(value, true);

	try {
		// Handle arrays
		if (Array.isArray(value)) {
			const items = value.map((item) => unique(item, seen));
			return `array:[${items.join(",")}]`;
		}

		// Handle specific object types
		if (value instanceof Date) {
			return `date:${value.toISOString()}`;
		}

		if (value instanceof RegExp) {
			return `regexp:${value.toString()}`;
		}

		if (value instanceof Map) {
			const entries = Array.from(value.entries())
				.sort(([a], [b]) => unique(a).localeCompare(unique(b)))
				.map(([k, v]) => `${unique(k, seen)}:${unique(v, seen)}`);
			return `map:{${entries.join(",")}}`;
		}

		if (value instanceof Set) {
			const items = Array.from(value)
				.map((item) => unique(item, seen))
				.sort();
			return `set:{${items.join(",")}}`;
		}

		// Handle plain objects
		const entries = Object.entries(value)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}:${unique(v, seen)}`);

		return `object:{${entries.join(",")}}`;
	} finally {
		seen.delete(value);
	}
}
