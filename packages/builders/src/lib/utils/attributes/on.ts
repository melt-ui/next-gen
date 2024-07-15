import { attribute } from "./attribute.js";
import type { Attributes } from "./attribute.js";

/**
 * Creates an event listener attribute object withthe give key and handler.
 *
 * @template K - The type of the event name. Must be a key of HTMLElementEventMap.
 * @param {K} key - The key of the event.
 * @param {(event: HTMLElementEventMap[K]) => void} handler - The event handler function.
 * @return {ReturnType<typeof attribute>} - The attribute object for the event listener.
 */
export const on = <K extends keyof HTMLElementEventMap>(
	key: K,
	handler: (event: HTMLElementEventMap[K]) => void,
): Attributes => {
	return attribute(`on${key}`, handler);
};
