import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isFunction, isHtmlElement } from "$lib/utils/is";
import { deepMerge } from "$lib/utils/merge";
import { autoOpenPopover, safelyHidePopover } from "$lib/utils/popover.svelte";
import {
	useFloating,
	type UseFloatingArgs,
	type UseFloatingConfig,
} from "$lib/utils/use-floating.svelte";
import { nanoid } from "nanoid";
import { useEventListener } from "runed";
import type { HTMLAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors } = createBuilderMetadata("popover", [
	"trigger",
	"content",
	"arrow",
]);

export type CloseOnOutsideClickCheck = (el: Element | Window | Document) => boolean;
type CloseOnOutsideClickProp = MaybeGetter<boolean | CloseOnOutsideClickCheck | undefined>;

export const isCloseOnOutsideClickCheck = (
	value: CloseOnOutsideClickProp,
): value is CloseOnOutsideClickCheck => isFunction(value) && value.length === 1;

export type PopoverProps = {
	/**
	 * If the Popover is open.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the value is supposed to change.
	 */
	onOpenChange?: (value: boolean) => void;

	/**
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * Config to be passed to `useFloating`
	 */
	floatingConfig?: UseFloatingArgs["config"];

	/**
	 * If the popover should have the same width as the trigger
	 *
	 * @default false
	 */
	sameWidth?: MaybeGetter<boolean | undefined>;

	/**
	 * If the popover should close when clicking escape.
	 *
	 * @default true
	 */
	closeOnEscape?: MaybeGetter<boolean | undefined>;

	/**
	 * If the popover should close when clicking outside.
	 * Alternatively, accepts a function that receives the clicked element,
	 * and returns if the popover should close.
	 *
	 * @default true
	 */
	closeOnOutsideClick?: CloseOnOutsideClickProp;
};

export class BasePopover {
	ids = $state({ invoker: nanoid(), popover: nanoid() });

	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	closeOnEscape = $derived(extract(this.#props.closeOnEscape, true));
	sameWidth = $derived(extract(this.#props.sameWidth, false));
	closeOnOutsideClick = $derived(extract(this.#props.closeOnOutsideClick, true));
	floatingConfig = $derived.by(() => {
		const config = extract(this.#props.floatingConfig, {} satisfies UseFloatingConfig);
		const sameWidth = extract(this.#props.sameWidth);
		const merged = deepMerge(config, sameWidth !== undefined ? { sameWidth } : {});
		return merged;
	});

	/* State */
	#open!: Synced<boolean>;

	constructor(props: PopoverProps = {}) {
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
		this.#props = props;
	}

	get open() {
		return this.#open.current;
	}

	set open(value) {
		this.#open.current = value;
	}

	#shouldClose(el: Node) {
		if (this.closeOnOutsideClick === false) return false;

		if (isFunction(this.closeOnOutsideClick)) {
			return isCloseOnOutsideClickCheck(this.closeOnOutsideClick)
				? this.closeOnOutsideClick(el as HTMLElement) // Pass target if it's the correct type
				: this.closeOnOutsideClick(); // Otherwise, call without arguments
		}

		return true;
	}

	protected get sharedProps() {
		return {
			onfocusout: async () => {
				await new Promise((r) => setTimeout(r));
				const contentEl = document.getElementById(this.ids.popover);
				const triggerEl = document.getElementById(this.ids.invoker);

				const activeEl = document.activeElement;
				if (
					!activeEl ||
					contentEl?.contains(activeEl) ||
					triggerEl?.contains(activeEl) ||
					!this.#shouldClose(activeEl) // Hack, we should probably have a focusOut prop
				) {
					return;
				}

				this.open = false;
			},
		};
	}

	/** The trigger that toggles the value. */
	protected getInvoker() {
		return {
			id: this.ids.invoker,
			popovertarget: this.ids.popover,
			onclick: (e: Event) => {
				e.preventDefault();
				this.open = !this.open;
			},
			...this.sharedProps,
		} as const;
	}

	protected getPopover() {
		// Show and hide popover based on open state
		const isVisible = $derived(this.open || this.forceVisible);
		$effect(() => {
			const el = document.getElementById(this.ids.popover);
			if (!isHtmlElement(el)) {
				return;
			}

			if (isVisible) {
				return autoOpenPopover({ el });
			} else {
				safelyHidePopover(el);
			}
		});

		$effect(() => {
			const contentEl = document.getElementById(this.ids.popover);
			const triggerEl = document.getElementById(this.ids.invoker);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl) || !this.open) {
				return;
			}

			useFloating({
				node: () => triggerEl,
				floating: () => contentEl,
				config: () => this.floatingConfig,
			});
		});

		useEventListener(
			() => document,
			"keydown",
			(e) => {
				if (!this.closeOnEscape) return;
				const el = document.getElementById(this.ids.popover);
				if (e.key !== "Escape" || !this.open || !isHtmlElement(el)) return;
				e.preventDefault();
				const openPopovers = [...el.querySelectorAll("[popover]")].filter((child) => {
					if (!isHtmlElement(child)) return false;
					// If child is a Melt popover, check if it's open
					if (child.matches(dataSelectors.content)) return child.dataset.open !== undefined;
					return child.matches(":popover-open");
				});

				if (openPopovers.length) return;
				// Set timeout to give time to all event listeners to run
				setTimeout(() => (this.open = false));
			},
		);

		useEventListener(
			() => document,
			"click",
			(e) => {
				if (!this.open) return; // Exit early if not open

				const contentEl = document.getElementById(this.ids.popover);
				const triggerEl = document.getElementById(this.ids.invoker);

				if (!contentEl || !triggerEl) return; // Exit if elements are missing

				const target = e.target as Node;
				const isInsideContent = contentEl.contains(target);
				const isInsideTrigger = triggerEl.contains(target);

				if (isInsideContent || isInsideTrigger) return; // Exit if clicked inside

				if (this.#shouldClose(target)) this.open = false;
			},
		);

		return {
			id: this.ids.popover,
			popover: "manual",
			ontoggle: (e) => {
				const newOpen = e.newState === "open";
				if (this.open !== newOpen && newOpen === false) {
					this.open = newOpen;
				}
			},
			// Needed so it receives focus on click, but not on tab, because of focus out
			tabindex: -1,
			inert: !this.open,
			"data-open": dataAttr(this.open),
			...this.sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get arrow() {
		return {
			[dataAttrs.arrow]: "",
			"data-arrow": "",
			"aria-hidden": true,
			"data-open": dataAttr(this.open),
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}

export class Popover extends BasePopover {
	declare ids: BasePopover["ids"] & {
		trigger: string;
		content: string;
	};

	constructor(props: PopoverProps = {}) {
		super({ ...props });
		this.ids = { ...this.ids, trigger: this.ids.invoker, content: this.ids.popover };
	}

	/** The trigger that toggles the value. */
	get trigger() {
		return Object.assign(this.getInvoker(), {
			[dataAttrs.trigger]: "",
		});
	}

	get content() {
		return Object.assign(this.getPopover(), {
			[dataAttrs.content]: "",
		});
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
