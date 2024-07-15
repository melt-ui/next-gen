import { attribute } from "./attribute.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates a data attribute object with the given key and value.
 *
 * @param {AriaKey} key - The key of the data attribute.
 * @param {unknown} value - The value of the data attribute.
 * @return {Attributes} The attribute object.
 */
export const data = (key: string, value: unknown): Attributes => {
	return attribute(`data-${key}`, value);
};
