export function findNext<T>(array: T[], condition: (item: T) => boolean): T | undefined {
	const index = array.findIndex(condition);

	if (index === -1) {
		return undefined; // Condition not met
	}

	const nextIndex = (index + 1) % array.length; // Wrap around

	return array[nextIndex];
}

export function findPrev<T>(array: T[], condition: (item: T) => boolean): T | undefined {
	const index = array.findIndex(condition);

	if (index === -1) {
		return undefined; // Condition not met
	}

	const prevIndex = (index - 1 + array.length) % array.length; // Wrap around

	return array[prevIndex];
}
