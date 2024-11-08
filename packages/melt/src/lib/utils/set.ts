export function toggle<T>(set: Set<T>, value: T): void {
	const deleted = set.delete(value);
	if (!deleted) {
		set.add(value);
	}
}
