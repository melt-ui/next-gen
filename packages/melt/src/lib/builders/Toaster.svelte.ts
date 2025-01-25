import type { HTMLAttributes } from "svelte/elements";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement, isTouch } from "../utils/is";
import { SvelteMap } from "svelte/reactivity";

const { dataAttrs, createIds } = createBuilderMetadata("toaster", ["root", "content", "title", "description", "close"]);

export type ToasterProps = {
	/**
	 * The delay in milliseconds before the toast closes. Set to 0 to disable.
	 * @default 5000
	 */
	closeDelay?: MaybeGetter<number | undefined>;

	/**
	 * The sensitivity of the toast for accessibility purposes.
	 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live
	 * @default 'polite'
	 */
	type?: MaybeGetter<'assertive' | 'polite' | undefined>;

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
	type?: 'assertive' | 'polite';

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
	type: 'assertive' | 'polite';
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
	type = $derived(extract(this.#props.type, 'polite'));
	hover = $derived(extract(this.#props.hover, 'pause'));

	// State
	#toastsMap = new SvelteMap<string, Toast<T>>();
	#ids = createIds();

	/** The active toasts. */
	toasts = $derived(Array.from(this.#toastsMap.values()));

	constructor(props: ToasterProps = {}) {
		this.#props = props;
	}

	/**
	 * Adds a toast.
	 */
	addToast(props: AddToastProps<T>) {
		const propsWithDefaults = {
			closeDelay: this.closeDelay,
			type: this.type,
			...props
		} satisfies AddToastProps<T>;

		const ids = createIds();
		
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

	/**
	 * Removes the toast with the specified ID.
	 * @param id The id of the toast.
	 */
	removeToast(id: string) {
		this.#toastsMap.delete(id);
	}

	/**
	 * Updates a toast's data.
	 * @param id The id of the toast.
	 * @param data The updated data.
	 */
	updateToast(id: string, data: T) {
		const toast = this.#toastsMap.get(id);
		if (!toast) return;

		this.#toastsMap.set(id, { ...toast, data });
	}

	/**
	 * Pauses the clearance timer of a toast.
	 * @param currentToast The toast.
	 */
	pauseToastTimer(currentToast: Toast<T>) {
		if (currentToast.timeout !== null) {
			window.clearTimeout(currentToast.timeout);
		}
		currentToast.pausedAt = performance.now();
	}

	/**
	 * Restarts a toast timer.
	 * @param currentToast The toast.
	 */
	restartToastTimer(currentToast: Toast<T>) {
		const pausedAt = currentToast.pausedAt ?? currentToast.createdAt;
		const elapsed = pausedAt - currentToast.createdAt - currentToast.pauseDuration;
		const remaining = currentToast.closeDelay - elapsed;

		currentToast.timeout = window.setTimeout(() => {
			this.removeToast(currentToast.id);
		}, remaining);

		currentToast.pauseDuration += performance.now() - pausedAt;
		currentToast.pausedAt = undefined;
	}

	/**
	 * Returns a ToastItem with the required spread attributes.
	 * @param toast The toast for which to return a ToastItem.
	 */
	getToastFromToaster(toast: Toast<T>) {
		return new ToastItem({
			toaster: this,
			toast
		});
	}

	/**
	 * Spread attributes for the container of the toasts.
	 */
	get root() {
		// Show toast root if toasts exist
		$effect(() => {
			const el = document.getElementById(this.#ids.root);
			if (!isHtmlElement(el)) {
				return;
			}

			if (this.toasts.length > 0) {
				el.showPopover();
				
				const toastEl = document.getElementById(this.toasts[0].ids.content);
				if (isHtmlElement(toastEl)) toastEl.focus();
			} else {
				el.hidePopover();
			}
		});

		return {
			[dataAttrs.root]: "",
			id: this.#ids.root,
			popover: "manual"
		} as const;
	}
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

	/** Pause toast timer. */
	readonly pauseToastTimer = () => {
		if (this.#toast.closeDelay === 0) return;
		this.#toaster.pauseToastTimer(this.#toast);
	}

	/** Restart toast timer. */
	readonly restartToastTimer = () => {
		if (this.#toast.closeDelay === 0) return;
		this.#toaster.restartToastTimer(this.#toast);
	}

	constructor(props: ToastItemProps<T>) {
		this.#props = props;
	}

	/**
	 * Spread attributes for a toast's content element.
	 */
	get content() {
		return {
			[dataAttrs.content]: "",
			id: this.#toast.id,
			role: 'alert',
			'aria-labelledby': this.#toast.ids.title,
			'aria-describedby': this.#toast.ids.description,
			'aria-live': this.#toast.type ?? this.#toaster.type,
			tabindex: -1,
			onpointerenter: (e: PointerEvent) => {
				if (isTouch(e)) return;

				if (this.#toaster.hover === 'pause') {
					this.pauseToastTimer();
				} else if (this.#toaster.hover === 'pause-all') {
					for (const currentToast of this.#toaster.toasts) {
						if (currentToast.closeDelay === 0) continue;
						this.#toaster.pauseToastTimer(currentToast);
					}
				}
			},
			onpointerleave: (e: PointerEvent) => {
				if (isTouch(e)) return;

				if (this.#toaster.hover === 'pause') {
					this.restartToastTimer();
				} else if (this.#toaster.hover === 'pause-all') {
					for (const currentToast of this.#toaster.toasts) {
						if (currentToast.closeDelay === 0) continue;
						this.#toaster.restartToastTimer(currentToast);
					}
				}
			}
		} as const;
	}

	get title() {
		return { id: this.#toast.ids.title };
	}

	get description() {
		return { id: this.#toast.ids.description };
	}

	/**
	 * Spread attributes for a toast's close button element.
	 */
	get close() {
		return {
			[dataAttrs.close]: "",
			onclick: () => {
				this.#toaster.removeToast(this.#toast.id);
			}
		} as const satisfies HTMLAttributes<HTMLButtonElement>;
	}
}