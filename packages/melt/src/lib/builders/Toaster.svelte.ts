import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import type { HTMLAttributes } from "svelte/elements";
import { SvelteMap } from "svelte/reactivity";
import { isHtmlElement, isTouch } from "../utils/is";
import { AnimationFrames } from "$lib/utils/animation-frames.svelte";
import { safelyHidePopover, safelyShowPopover } from "$lib/utils/popover";
import { watch } from "runed";

const toasterMeta = createBuilderMetadata("toaster", ["root"]);

const toastMeta = createBuilderMetadata("toaster-toast", [
	"content",
	"title",
	"description",
	"close",
]);

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
	type?: MaybeGetter<"assertive" | "polite" | undefined>;

	/**
	 * The behaviour when a toast is hovered.
	 * Pass in `null` to disable.
	 *
	 * @default 'pause'
	 */
	hover?: MaybeGetter<"pause" | "pause-all" | null | undefined>;
};

export type AddToastProps<T = object> = {
	/**
	 * The delay in milliseconds before the toast closes. Set to 0 to disable.
	 * If `undefined`, uses the `closeDelay` defined in the parent toaster.
	 */
	closeDelay?: number;

	/**
	 * The sensitivity of the toast for accessibility purposes.
	 * If `undefined`, uses the `type` defined in the parent toaster.
	 */
	type?: "assertive" | "polite";

	/**
	 * The data passed to the toaster.
	 */
	data: T;
};

export class Toaster<T = object> {
	// Props
	#props!: ToasterProps;
	ids = toasterMeta.createIds();
	closeDelay = $derived(extract(this.#props.closeDelay, 5000));
	type = $derived(extract(this.#props.type, "polite"));
	hover = $derived(extract(this.#props.hover, "pause"));

	// State
	#toastsMap = new SvelteMap<string, Toast<T>>();

	/** The active toasts. */
	toasts = $derived(Array.from(this.#toastsMap.values()));

	#subscribers = 0;

	constructor(props: ToasterProps = {}) {
		this.#props = props;
	}

	/**
	 * Adds a toast.
	 */
	addToast = (props: AddToastProps<T>) => {
		const propsWithDefaults = {
			closeDelay: this.closeDelay,
			type: this.type,
			...props,
		} satisfies AddToastProps<T>;

		const id = window.crypto.randomUUID();

		const toast = new Toast({
			toaster: this,
			id,
			...propsWithDefaults,
		});
		this.#toastsMap.set(id, toast);

		return toast;
	};

	/**
	 * Removes the toast with the specified ID.
	 * @param id The id of the toast.
	 */
	removeToast = (id: string) => {
		const toast = this.#toastsMap.get(id);
		if (!toast) return;

		this.#toastsMap.delete(id);
		toast.cleanup();
	};

	/**
	 * Updates a toast's data.
	 * @param id The id of the toast.
	 * @param data The updated data.
	 */
	updateToast = (id: string, data: T) => {
		const toast = this.#toastsMap.get(id);
		if (!toast) return;

		toast.data = data;
	};

	/**
	 * Spread attributes for the container of the toasts.
	 */
	get root() {
		if ($effect.tracking()) {
			this.#subscribers++;
			$effect(() => {
				return () => {
					this.#subscribers--;
				};
			});

			watch(
				() => this.#subscribers,
				(s) => {
					if (s !== 1) return;
					$effect(() => {
						const el = document.getElementById(this.ids.root);
						if (!isHtmlElement(el)) return;

						if (!this.toasts.length) {
							safelyHidePopover(el);
							return;
						}
						safelyShowPopover(el);
					});
				},
			);
		}

		return {
			[toasterMeta.dataAttrs.root]: "",
			id: this.ids.root,
			popover: "manual",
		} as const;
	}
}

type ToastProps<T = object> = {
	/**
	 * The parent toaster instance
	 */
	toaster: Toaster<T>;
	/**
	 * The toast's unique ID.
	 */
	id: string;
	/**
	 * How many milliseconds the toast will stay open.
	 */
	closeDelay: number;
	/**
	 * The sensitivity of the toast for accessibility purposes.
	 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live
	 */
	type: "assertive" | "polite";
	/**
	 * The data that was passed when calling `addToast`
	 */
	data: T;
};

class Toast<T = object> {
	/** Props */
	#props!: ToastProps<T>;
	readonly toaster = $derived(this.#props.toaster);
	readonly id = $derived(this.#props.id);
	/** The original data you passed to the `addToast` function. */
	data: T = $state() as T;
	readonly closeDelay = $derived(this.#props.closeDelay);
	readonly type = $derived(this.#props.type);

	/** State */
	ids = toastMeta.createIds();
	readonly createdAt: number;
	#frames: AnimationFrames | undefined;
	timeElapsed = $state(0);
	readonly percentage = $derived((100 * this.timeElapsed) / this.closeDelay);

	constructor(props: ToastProps<T>) {
		this.#props = props;
		this.data = props.data;
		this.createdAt = performance.now();

		if (!this.closeDelay) return;

		this.#frames = new AnimationFrames(({ delta }) => {
			this.timeElapsed += delta;
			if (this.timeElapsed > this.closeDelay) {
				this.removeSelf();
			}
		});
	}

	/** Remove toast. */
	readonly removeSelf = () => {
		this.toaster.removeToast(this.id);
	};

	/** @internal */
	readonly cleanup = () => {
		this.#frames?.stop();
	};

	/** Pause toast timer. */
	readonly pause = () => {
		this.#frames?.stop();
	};

	/** Reset toast timer. */
	readonly reset = () => {
		this.timeElapsed = 0;
		this.#frames?.start();
	};

	/** Resume toast timer */
	readonly resume = () => {
		this.#frames?.start();
	};

	/**
	 * Spread attributes for a toast's content (wrapper) element.
	 */
	get content() {
		return {
			[toastMeta.dataAttrs.content]: "",
			id: this.ids.content,
			role: "alert",
			"aria-labelledby": this.ids.title,
			"aria-describedby": this.ids.description,
			"aria-live": this.type ?? this.toaster.type,
			tabindex: -1,
			onpointerenter: (e: PointerEvent) => {
				if (isTouch(e)) return;

				if (this.toaster.hover === "pause") {
					this.pause();
				} else if (this.toaster.hover === "pause-all") {
					for (const toast of this.toaster.toasts) {
						toast.pause();
					}
				}
			},
			onpointerleave: (e: PointerEvent) => {
				if (isTouch(e)) return;

				if (this.toaster.hover === "pause") {
					this.resume();
				} else if (this.toaster.hover === "pause-all") {
					for (const toast of this.toaster.toasts) {
						toast.resume();
					}
				}
			},
		} as const;
	}

	/**
	 * Spread attributes for a toast's title element.
	 */
	get title() {
		return { id: this.ids.title };
	}

	/**
	 * Soread attributes for a toast's description element.
	 */
	get description() {
		return { id: this.ids.description };
	}

	/**
	 * Spread attributes for a toast's close button element.
	 */
	get close() {
		return {
			[toastMeta.dataAttrs.close]: "",
			onclick: () => {
				this.removeSelf();
			},
		} as const satisfies HTMLAttributes<HTMLButtonElement>;
	}
}
