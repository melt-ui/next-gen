import { PACKAGE_NAME } from "../constants.js";
import { data } from "./data.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates a melt attribute object with the given key and value.
 *
 * @param {string} key - The name of the melt attribute.
 * @param {unknown} value - The value of the melt attribute.
 * @return {Attributes} The melt attribute object.
 */
export const melt = (key: string, value: unknown): Attributes => {
	return data(`${PACKAGE_NAME}-${key}`, value);
};
