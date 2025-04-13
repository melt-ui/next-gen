import type { HTMLAttributes } from "svelte/elements";
import { isFunction, isString } from "./is";

// Source: https://stackoverflow.com/questions/51603250/typescript-3-parameter-list-intersection-type/51604379#51604379
type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V }
	? NullToObject<V>
	: never;

type NullToObject<T> = T extends null | undefined ? object : T;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
	? I
	: never;

function isEventHandler(key: string): boolean {
	return key.length > 2 && key.startsWith("on") && key.toLowerCase() === key;
}

/**
 * Composes event handlers into a single function that can be called with an event.
 * If the previous handler cancels the event using `event.preventDefault()`, the handlers
 * that follow will not be called.
 */
function composeHandlers<E extends Event = Event, T extends Element = Element>(
	...handlers: Array<EventListener>
): (e: E) => void {
	return function (this: T, e: E) {
		for (const handler of handlers) {
			handler.call(this, e);
		}
	};
}

/**
 * Executes an array of callback functions with the same arguments.
 * @template T The types of the arguments that the callback functions take.
 * @param callbacks array of callback functions to execute.
 * @returns A new function that executes all of the original callback functions with the same arguments.
 */
export function executeCallbacks<T extends unknown[]>(
	...callbacks: T
): (...args: unknown[]) => void {
	return (...args: unknown[]) => {
		for (const callback of callbacks) {
			if (typeof callback === "function") {
				callback(...args);
			}
		}
	};
}

/**
 * Given a list of attribute objects, merges them into a single object.
 * - Automatically composes event handlers (e.g. `onclick`, `oninput`, etc.)
 * - Chains regular functions with the same name so they are called in order
 * - Handles a bug with Svelte where setting the `hidden` attribute to `false` doesn't remove it
 * - Merges style attributes
 * - Overrides other values with the last one
 */
export function mergeAttrs<T extends HTMLAttributes<HTMLElement>[]>(
	...args: T
): UnionToIntersection<TupleTypes<T>> {
	const result: Record<string, unknown> = { ...args[0] };

	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		for (const key in props) {
			const a = result[key];
			const b: unknown = key in props ? props[key as any] : undefined;

			// compose event handlers
			if (isFunction(a) && isFunction(b) && isEventHandler(key)) {
				// handle merging of event handlers
				const aHandler = a as EventListener;
				const bHandler = b as EventListener;
				result[key] = composeHandlers(aHandler, bHandler);
			} else if (isFunction(a) && isFunction(b)) {
				// chain non-event handler functions
				result[key] = executeCallbacks(a, b);
			} else if (isString(a) && isString(b) && key === "style") {
				result[key] = [a, b].join(";");
			} else {
				// override other values
				result[key] = b !== undefined ? b : a;
			}
		}
	}

	// handle weird svelte bug where `hidden` is not removed when set to `false`
	if (result.hidden !== true) {
		delete result.hidden;
	}

	// handle weird svelte bug where `disabled` is not removed when set to `false`
	if (result.disabled !== true) {
		delete result.disabled;
	}

	return result as UnionToIntersection<TupleTypes<T>>;
}
