export type State<T> = {
	value: T;
};

export type Computed<T> = {
	current: T;
};

export interface Context {
	state: <T>(initial: T) => State<T>;
	computed: <T>(cb: () => T) => Computed<T>;
	effect: (cb: () => void) => void;
}

let context: Context | null = null;

export function initMuramasa(ctx: Context) {
	context = ctx;
}

export function state<T>(initial: T): State<T> {
	if (!context) {
		throw new Error('muramasa is not initialized');
	}

	return context.state(initial);
}

export function computed<T>(cb: () => T): Computed<T> {
	if (!context) {
		throw new Error('muramasa is not initialized');
	}

	return context.computed(cb);
}

export function effect(cb: () => void) {
	if (!context) {
		throw new Error('muramasa is not initialized');
	}

	return context.effect(cb);
}

export * from './svelte.svelte.js';
export * from './vue.js';
export * from './react.js';
export * from './solid.js';
