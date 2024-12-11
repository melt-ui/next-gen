const Symbols = {
	state: Symbol('state'),
	computed: Symbol('computed')
};

export type State<T> = {
	value: T;
};

export type Computed<T> = {
	current: T;
};

export type MaybeState<T> = T | State<T>;

export type MaybeComputed<T> = T | Computed<T>;

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

	const o = context.state(initial);
	return Object.assign(o, { [Symbols.state]: '' });
}

export function isState<T>(v: unknown): v is State<T> {
	return typeof v === 'object' && v !== null && Symbols.state in v;
}

export function computed<T>(cb: () => T): Computed<T> {
	if (!context) {
		throw new Error('muramasa is not initialized');
	}

	const o = context.computed(cb);
	return Object.assign(o, { [Symbols.computed]: '' });
}

export function isComputed<T>(v: unknown): v is Computed<T> {
	return typeof v === 'object' && v !== null && Symbols.computed in v;
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
