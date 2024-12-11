export function state<T>(initial: T): T;
export function state<T>(): T | undefined;
export function state<T>(initial?: T) {
	let value = $state(initial);

	return {
		get $() {
			return value;
		},
		set $(v) {
			value = v;
		},
	};
}
