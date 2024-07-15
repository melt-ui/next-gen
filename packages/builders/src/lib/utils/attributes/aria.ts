import { attribute } from "./attribute.js";
import type { AriaAttributes } from "svelte/elements";
import type { Attributes } from "./attribute.js";

export type AriaKey = keyof AriaAttributes extends `aria-${infer R}` ? R : never;

/**
 * Creates an aria attribute object with the given key and value.
 *
 * @param {AriaKey} key - The key of the ARIA attribute.
 * @param {unknown} value - The value of the ARIA attribute.
 * @return {Attributes} The ARIA attribute object.
 */
export const aria = (key: AriaKey, value: unknown): Attributes => {
	return attribute(`aria-${key}`, value);
};
