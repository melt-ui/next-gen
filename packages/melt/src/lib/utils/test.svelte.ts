import { flushSync } from "svelte";
import { test, vi, type TestOptions } from "vitest";
import { kbd } from "./keyboard";

export function testWithEffect(
	name: string,
	fn: () => void | Promise<void>,
	options?: number | Omit<TestOptions, "shuffle">
): ReturnType<typeof test> {
	return test(name, async () => {
		let promise: void | Promise<void>;
		const cleanup = $effect.root(() => {
			promise = fn();
		});

		try {
			await promise!;
		} finally {
			cleanup();
		}
	}, options);
}

export function vitestSetTimeoutWrapper(fn: () => void, timeout: number) {
	setTimeout(async () => {
		fn();
	}, timeout + 1);

	vi.advanceTimersByTime(timeout);
}

export function focus(node: HTMLElement | null | undefined) {
	if (node) {
		flushSync(() => node.focus());
	}
}

type KbdKeys = keyof typeof kbd;
/**
 * A wrapper around the internal kbd object to make it easier to use
 * in tests which require the key names to be wrapped in curly braces.
 */
export const testKbd: Record<KbdKeys, string> = Object.entries(kbd).reduce((acc, [key, value]) => {
	acc[key as KbdKeys] = `{${value}}`;
	return acc;
}, {} as Record<KbdKeys, string>);

export function exists(get: (id: string) => HTMLElement, testId: string) {
	try {
		get(testId);
		return true;
	} catch {
		return false;
	}
}
