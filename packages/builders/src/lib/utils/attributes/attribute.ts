import type { HTMLAttributes } from "svelte/elements";

export type Attributes = HTMLAttributes<HTMLElement>;

/**
 * Creates a single attribute object with the given key and value.
 *
 * @param {AriaKey} key - The key of the attribute.
 * @param {unknown} value - The value of the attribute.
 * @return {Attributes} The attribute object.
 */
export const attribute = (key: string, value: unknown): Attributes => {
	return {
		[key]: value,
	};
};

/**
 * Creates a merged set of attributes from the provided list of attribute objects.
 * Will ensure multiple event handlers are merged into a single function.
 *
 * @param {Array<Attributes>} attributes - An array of attribute objects to merge.
 * @return {Attributes} The resulting merged attributes object.
 */
export const attributes = (...attributes: Array<Attributes>): Attributes => {
	const result: Attributes = {};
	const map = new Map<string, Array<(...args: unknown[]) => unknown>>();
	for (const attribute of attributes) {
		for (const [key, value] of Object.entries(attribute)) {
			if (key.indexOf("on") === 0 && typeof value === "function") {
				if (!map.has(key)) {
					map.set(key, [value]);
					Object.assign(result, {
						[key]: (...args: unknown[]) => {
							return map.get(key)?.map((fn) => fn(...args));
						},
					});
				} else {
					map.get(key)?.push(value);
				}
			} else {
				Object.assign(result, attribute);
			}
		}
	}
	return result;
};
