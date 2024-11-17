export function last<T>(values: Iterable<T>) {
	let result: T | undefined;
	for (const value of values) {
		result = value;
	}
	return result;
}
