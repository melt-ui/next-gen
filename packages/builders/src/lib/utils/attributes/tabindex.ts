import { attribute } from "./attribute.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates an tabindex attribute object with the given tabindex.
 *
 * @param {number} tabindex - The value of the tabindex attribute.
 * @return {Attributes} The attribute object.
 */
export const tabindex = (tabindex: number): Attributes => {
	return attribute("tabindex", tabindex);
};
