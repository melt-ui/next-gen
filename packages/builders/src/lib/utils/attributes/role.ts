import type { AriaRole } from "svelte/elements";
import { attribute } from "./attribute.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates an role attribute object with the given role.
 *
 * @param {AriaRole} role - The value of the role attribute.
 * @return {Attributes} The attribute object.
 */
export const role = (role: AriaRole): Attributes => {
	return attribute("role", role);
};
