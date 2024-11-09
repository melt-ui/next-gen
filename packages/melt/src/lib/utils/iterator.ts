export function last<T>(iterable: Iterable<T>): T | undefined {
	let result: T | undefined;
	for (const value of iterable) {
		result = value;
	}
	return result;
}
