/**
 * Generic fuzzy search function that searches through arrays and returns matching items
 *
 * @param options Configuration object for the fuzzy search
 * @returns Array of items that match the search criteria
 */
export default function fuzzysearch<T>(options: {
	needle: string;
	haystack: readonly T[];
	property: keyof T | ((item: T) => string);
}): readonly T[] {
	const { needle, haystack, property } = options;

	if (!Array.isArray(haystack)) {
		throw new Error("Haystack must be an array");
	}

	if (!property) {
		throw new Error("Property selector is required");
	}

	// Convert needle to lowercase for case-insensitive matching
	const lowerNeedle = needle.toLowerCase();

	// Filter the haystack to find matching items
	return haystack.filter((item) => {
		// Extract the string value from the item based on the property selector
		const value = typeof property === "function" ? property(item) : String(item[property]);

		// Convert to lowercase for case-insensitive matching
		const lowerValue = value.toLowerCase();

		// Perform the fuzzy search
		return fuzzyMatchString(lowerNeedle, lowerValue);
	});
}

/**
 * Internal helper function that performs the actual fuzzy string matching
 */
function fuzzyMatchString(needle: string, haystack: string): boolean {
	const hlen = haystack.length;
	const nlen = needle.length;

	if (nlen > hlen) {
		return false;
	}

	if (nlen === hlen) {
		return needle === haystack;
	}

	outer: for (let i = 0, j = 0; i < nlen; i++) {
		const nch = needle.charCodeAt(i);
		while (j < hlen) {
			if (haystack.charCodeAt(j++) === nch) {
				continue outer;
			}
		}
		return false;
	}

	return true;
}
