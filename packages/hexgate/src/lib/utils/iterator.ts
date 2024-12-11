export function last<T>(values: Iterable<T>) {
	let result: T | undefined;
	for (const value of values) {
		result = value;
	}
	return result;
}

export function first<T>(values: Iterable<T>) {
	let result: T | undefined;
	for (const value of values) {
		result = value;
		break;
	}
	return result;
}

export function forEach<T>(values: Iterable<T>, callback: (value: T) => void) {
	for (const value of values) {
		callback(value);
	}
}
