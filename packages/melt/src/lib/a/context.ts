import type { MaybeGetter } from "$lib/types";
import type { ReadSignal } from "@maverick-js/signals";

type ToComputed<T> = (v: MaybeGetter<T>, defaultValue?: T) => ReadSignal<T>;

const context = { toComputed: null } as any;

export function toComputed<T>(v: MaybeGetter<T>, defaultValue?: T) {
	if (!context.toComputed) throw new Error("ToComputed not initialized");
	return context.toComputed(v, defaultValue);
}

export function init(tc: ToComputed<any>) {
	context.toComputed = tc;
}
