import { attribute } from "./attribute.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates an id attribute object with the given id.
 *
 * @param {unknown} id - The value of the id attribute.
 * @return {Attributes} The attribute object.
 */
export const id = (id: unknown): Attributes => {
	return attribute("id", id);
};
