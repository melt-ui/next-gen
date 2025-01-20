import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { createDataIds, createIds } from "$lib/utils/identifiers";
import { isTouch } from "../utils/is";
import { SvelteMap } from "svelte/reactivity";

const dataIds = createDataIds("toaster", ["content", "title", "description", "close"]);
const toastDataIds = createDataIds("toast", ["content", "title", "description"]);

export type ToasterProps = {
	/**
	 * The delay in milliseconds before the toast closes. Set to 0 to disable.
	 * @default 5000
	 */
	closeDelay?: MaybeGetter<number | undefined>;

	/**
	 * The sensitivity of the toast for accessibility purposes.
	 * @default 'foreground'
	 */
	type?: MaybeGetter<'foreground' | 'background' | undefined>;

	/**
	 * The behaviour when a toast is hovered.
	 * @default 'pause'
	 */
	hover?: MaybeGetter<'pause' | 'pause-all' | null | undefined>;
};

export type AddToastProps<T = object> = {
	/**
	 * The delay in milliseconds before the toast closes. Set to 0 to disable.
	 */
	closeDelay?: number;

	/**
	 * The sensitivity of the toast for accessibility purposes.
	 */
	type?: 'foreground' | 'background';

	/**
	 * The data passed to the toaster.
	 */
	data: T;
};

export type Toast<T = object> = {
	id: string;
	ids: {
		content: string;
		title: string;
		description: string;
	};
	closeDelay: number;
	type: 'foreground' | 'background';
	data: T;
	timeout: number | null;
	createdAt: number;
	pausedAt?: number;
	pauseDuration: number;
	getPercentage: () => number;
};

export class Toaster<T = object> {
	// Props
	#props!: ToasterProps;
	closeDelay = $derived(extract(this.#props.closeDelay, 5000));
	type = $derived(extract(this.#props.type, 'foreground'));
	hover = $derived(extract(this.#props.hover, 'pause'));

	// State
	#toastsMap = new SvelteMap<string, Toast<T>>();

	/** The active toasts. */
	toasts = $derived(Array.from(this.#toastsMap.values()));

	constructor(props: ToasterProps = {}) {
		this.#props = props;
	}

	addToast(props: AddToastProps<T>) {
		const propsWithDefaults = {
			closeDelay: this.closeDelay,
			type: this.type,
			...props
		} satisfies AddToastProps<T>;

		const ids = createIds(toastDataIds);
		
		const timeout = propsWithDefaults.closeDelay === 0
			? null
			: window.setTimeout(() => {
				this.removeToast(ids.content);
			}, propsWithDefaults.closeDelay);

		const getPercentage = () => {
			const { createdAt, pauseDuration, closeDelay, pausedAt } = toast;
			if (closeDelay === 0) return 0;

			if (pausedAt) {
				return (100 * (pausedAt - createdAt - pauseDuration)) / closeDelay;
			} else {
				const now = performance.now();
				return (100 * (now - createdAt - pauseDuration)) / closeDelay;
			}
		};

		const toast = {
			id: ids.content,
			ids,
			...propsWithDefaults,
			timeout,
			createdAt: performance.now(),
			pauseDuration: 0,
			getPercentage,
		} as Toast<T>;

		this.#toastsMap.set(ids.content, toast);

		return toast;
	}

	removeToast(id: string) {
		this.#toastsMap.delete(id);
	}

	updateToast(id: string, data: T) {
		const toast = this.#toastsMap.get(id);
		if (!toast) return;

		this.#toastsMap.set(id, { ...toast, data });
	}

	#pauseToastTimer(currentToast: Toast<T>) {
		if (currentToast.timeout !== null) {
			window.clearTimeout(currentToast.timeout);
		}
		currentToast.pausedAt = performance.now();
	}

	#restartToastTimer(currentToast: Toast<T>) {
		const pausedAt = currentToast.pausedAt ?? currentToast.createdAt;
		const elapsed = pausedAt - currentToast.createdAt - currentToast.pauseDuration;
		const remaining = currentToast.closeDelay - elapsed;

		currentToast.timeout = window.setTimeout(() => {
			this.removeToast(currentToast.id);
		}, remaining);

		currentToast.pauseDuration += performance.now() - pausedAt;
		currentToast.pausedAt = undefined;
	}

	getToastFromToaster(toast: Toast<T>) {
		return new ToastItem({
			toaster: this,
			toast
		});
	}

	// get content() {
	// 	return {

	// 	};
	// }
}

type ToastItemProps<T = object> = {
	toaster: Toaster<T>;
	toast: Toast<T>;
};

class ToastItem<T = object> {
	#props!: ToastItemProps<T>;
	#toaster = $derived(this.#props.toaster);
	#toast = $derived(this.#props.toast);

	data = $derived(this.#props.toast.data);

	constructor(props: ToastItemProps<T>) {
		this.#props = props;
	}

	get content() {
		return {
			id: this.#toast.id,
			role: 'alert',
			'aria-describedby': this.#toast.ids.description,
			'aria-labeldby': this.#toast.ids.title,
			'aria-live': this.#toaster.type === 'foreground' ? 'assertive' : 'polite',
			tabindex: -1,
			'onpointerenter': (e: PointerEvent) => {
				if (isTouch(e)) return;

				// TODO
			}
		} as const;
	}

	get title() {
		return { id: this.#toast.ids.title };
	}

	get description() {
		return { id: this.#toast.ids.description };
	}

	get close() {
		return {};
	}
}