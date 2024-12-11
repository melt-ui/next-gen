import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { effect, isFunction, readonly, signal, type ReadSignal } from "@maverick-js/signals";

export function receive<T>(a: T): T {
	const res = $state({});
	effect(() => {
		for (const k in a as any) {
			res[k] = a[k];
		}
	});

	return res;
}

export function send<T>(a: T): T {
	const res = {};

	for (const k in a) {
		console.log("extract", k, extract(a[k]));
		if (!extract(a[k])) continue;
		res[k] = signal(extract(a[k]));
	}

	$effect.pre(() => {
		for (const k in res) {
			console.log(k, res[k]());
			res[k].set(extract(a[k]));
		}
	});

	for (const k in res) {
		console.log(k, res[k]());
	}
	return res;
}

export function toComputed<T>(v: MaybeGetter<T>, defautlValue?: T) {
	const derived = $derived(extract(v, defautlValue));
	const sig = signal(derived);
	$effect(() => {
		sig.set(derived);
	});

	return readonly(sig) as ReadSignal<T>;
}
