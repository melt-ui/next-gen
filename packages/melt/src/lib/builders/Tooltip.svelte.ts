import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { addEventListener } from "$lib/utils/event";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { isPointerInGraceArea } from "$lib/utils/pointer";
import { computeConvexHullFromElements } from "$lib/utils/polygon";
import { safelyHidePopover, safelyShowPopover } from "$lib/utils/popover";
import { useFloating, type UseFloatingArgs } from "$lib/utils/use-floating.svelte";
import { useEventListener, watch } from "runed";
import { untrack } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { on } from "svelte/events";

const { createIds, dataAttrs, dataSelectors } = createBuilderMetadata("tooltip", [
	"trigger",
	"content",
	"arrow",
]);

type OpenReason = "pointer" | "focus";

export type TooltipProps = {
	/**
	 * If the Tooltip is open.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the value is supposed to change.
	 */
	onOpenChange?: (value: boolean) => void;

	/**
	 * Size of tooltip arrow in pixels.
	 *
	 * @default 8
	 */
	arrowSize?: MaybeGetter<number | undefined>;

	/**
	 * If `true`, tooltip will close if trigger is pressed.
	 *
	 * @default true
	 */
	closeOnPointerDown?: MaybeGetter<boolean | undefined>;

	/**
	 * Tooltip open delay in milliseconds.
	 *
	 * @default 1000
	 */
	openDelay?: MaybeGetter<number | undefined>;

	/**
	 * Tooltip close delay in milliseconds.
	 *
	 * @default 0
	 */
	closeDelay?: MaybeGetter<number | undefined>;

	/**
	 * Config to be passed to `useFloating`
	 */
	floatingConfig?: UseFloatingArgs["config"];

	/**
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * If `true`, leaving trigger will close the tooltip.
	 *
	 * @default false
	 */
	disableHoverableContent?: MaybeGetter<boolean | undefined>;
};

export class Tooltip {
	#ids = createIds();

	/** Props */
	#props!: TooltipProps;
	closeOnPointerDown = $derived(extract(this.#props.closeOnPointerDown, true));
	openDelay = $derived(extract(this.#props.openDelay, 1000));
	closeDelay = $derived(extract(this.#props.closeDelay, 0));
	disableHoverableContent = $derived(extract(this.#props.disableHoverableContent, false));
	arrowSize = $derived(extract(this.#props.arrowSize, 8));
	forceVisible = $derived(extract(this.#props.forceVisible, false));

	/** State */
	isVisible = $derived(this.open || this.forceVisible);
	#open!: Synced<boolean>;
	#openReason: OpenReason | null = $state(null);
	#clickedTrigger: boolean = $state(false);
	#isPointerInsideTrigger: boolean = $state(false);
	#isPointerInsideContent: boolean = $state(false);
	#isMouseInTooltipArea: boolean = $state(false);
	#openTimeout: number | null = $state(null);
	#closeTimeout: number | null = $state(null);

	constructor(props: TooltipProps = {}) {
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
		this.#props = props;

		watch([() => this.open, () => this.#openReason], () => {
			if (!this.open || typeof document === "undefined") return;

			return on(document, "mousemove", (e) => {
				const contentEl = document.getElementById(this.#ids.content);
				const triggerEl = document.getElementById(this.#ids.trigger);
				if (!contentEl || !triggerEl) {
					if (this.open) this.#closeTooltip();
					return;
				}

				const polygonElements = this.disableHoverableContent ? [triggerEl] : [triggerEl, contentEl];
				const polygon = computeConvexHullFromElements(polygonElements);

				this.#isMouseInTooltipArea =
					this.#isPointerInsideContent ||
					this.#isPointerInsideTrigger ||
					isPointerInGraceArea(e, polygon);

				if (this.#openReason !== "pointer") return;

				if (!this.#isMouseInTooltipArea) {
					this.#closeTooltip();
				}
			});
		});
	}

	get open() {
		return this.#open.current;
	}

	set open(value: boolean) {
		this.#open.current = value;
	}

	get #sharedProps() {
		return {
			onfocusout: async () => {
				await new Promise((r) => setTimeout(r)); // tick
				const contentEl = document.getElementById(this.#ids.content);
				const triggerEl = document.getElementById(this.#ids.trigger);

				if (
					contentEl?.contains(document.activeElement) ||
					triggerEl?.contains(document.activeElement)
				) {
					return;
				}
				this.open = false;
			},
		};
	}

	get trigger() {
		$effect(() => {
			const el = document.getElementById(this.#ids.content);
			if (!isHtmlElement(el)) return;

			return () => (this.#isPointerInsideTrigger = false);
		});

		return {
			[dataAttrs.trigger]: "",
			id: this.#ids.trigger,
			"aria-describedby": this.#ids.content,
			"data-open": dataAttr(this.open),
			onpointerdown: () => {
				if (!this.closeOnPointerDown) return;

				this.open = false;
				this.#clickedTrigger = true;
				this.#stopOpening();
			},
			onpointerenter: (e) => {
				this.#isPointerInsideTrigger = true;
				if (e.pointerType === "touch") return;

				this.#openTooltip("pointer");
			},
			onpointerleave: (e) => {
				this.#isPointerInsideTrigger = false;
				if (e.pointerType === "touch") return;

				this.#stopOpening();
			},
			onfocus: () => {
				if (this.#clickedTrigger) return;

				this.#openTooltip("focus");
			},
			onblur: () => this.#closeTooltip(true),
			...this.#sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get content() {
		$effect(() => {
			const triggerEl = document.getElementById(this.#ids.trigger);
			const contentEl = document.getElementById(this.#ids.content);

			if (!triggerEl || !contentEl || !this.open) return;

			useFloating({
				node: () => triggerEl,
				floating: () => contentEl,
				config: this.#props.floatingConfig,
			});
		});

		$effect(() => {
			const triggerEl = document.getElementById(this.#ids.trigger);
			const contentEl = document.getElementById(this.#ids.content);

			if (!triggerEl || !contentEl) return;

			if (!this.isVisible) {
				safelyHidePopover(contentEl);
				return () => (this.#isPointerInsideContent = false);
			}

			// Check if there's a parent tooltip. If so, only open if the parent's open.
			// This is to guarantee correct layering.
			const parent = isHtmlElement(contentEl.parentNode)
				? contentEl.parentNode.closest(dataSelectors.content)
				: undefined;

			if (!isHtmlElement(parent)) {
				safelyShowPopover(contentEl);
				return;
			}

			if (parent.dataset.open !== undefined) safelyShowPopover(contentEl);

			const toggleUnsub = addEventListener(parent, "toggle", async (e) => {
				await new Promise((r) => setTimeout(r));

				const isOpen = e.newState === "open";
				if (isOpen) {
					safelyShowPopover(contentEl);
				} else {
					safelyHidePopover(contentEl);
				}
			});

			const observer = new MutationObserver((mutations) =>
				untrack(() => {
					const parent = mutations[0]?.target;

					if (!isHtmlElement(parent)) return;

					if (parent.inert && this.open) {
						this.#closeTooltip();
					}
				}),
			);

			observer.observe(parent, {
				attributes: true,
			});

			return () => {
				toggleUnsub();
				observer.disconnect();
			};
		});

		useEventListener(
			() => document,
			"scroll",
			(e) => this.#handleScroll(e),
			{ capture: true },
		);

		useEventListener(
			() => document,
			"keydown",
			(e) => {
				const el = document.getElementById(this.#ids.content);
				if (e.key !== "Escape" || !this.open || !el) return;

				e.preventDefault();
				const openTooltips = [...el.querySelectorAll("[popover]")].filter((child) => {
					if (!isHtmlElement(child)) return false;
					// If child is a Melt popover, check if it's open
					if (child.matches(dataSelectors.content)) return child.dataset.open !== undefined;
					return child.matches(":popover-open");
				});

				if (openTooltips.length) return;

				this.#stopOpening();
				setTimeout(() => (this.open = false));
			},
		);

		return {
			[dataAttrs.content]: "",
			id: this.#ids.content,
			popover: "manual",
			role: "tooltip",
			tabindex: -1,
			style: `overflow: visible;`,
			inert: !this.open,
			"data-open": dataAttr(this.open),
			onpointerenter: () => {
				this.#isPointerInsideContent = true;
				this.#openTooltip("pointer");
			},
			onpointerleave: () => {
				this.#isPointerInsideContent = false;
			},
			onpointerdown: () => this.#openTooltip("pointer"),
			...this.#sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get arrow() {
		return {
			[dataAttrs.arrow]: "",
			id: this.#ids.arrow,
			"data-arrow": "",
			"data-open": dataAttr(this.open),
			style: `position: absolute; width: var(--arrow-size, ${this.arrowSize}px); height: var(--arrow-size, ${this.arrowSize}px);`,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	#openTooltip(reason: OpenReason) {
		if (this.#closeTimeout) {
			window.clearTimeout(this.#closeTimeout);
			this.#closeTimeout = null;
		}

		if (!this.#openTimeout) {
			this.#openTimeout = window.setTimeout(() => {
				this.open = true;
				this.#openReason = this.#openReason ?? reason;
				this.#openTimeout = null;
			}, this.openDelay);
		}
	}

	#stopOpening() {
		if (this.#openTimeout) {
			window.clearTimeout(this.#openTimeout);
			this.#openTimeout = null;
		}
	}

	#closeTooltip(isBlur?: boolean) {
		const contentEl = document.getElementById(this.#ids.content);
		if (!isHtmlElement(contentEl)) return;

		this.#stopOpening();

		if (isBlur && this.#isMouseInTooltipArea) {
			this.#openReason = "pointer";
			return;
		}

		if (!this.#closeTimeout) {
			this.#closeTimeout = window.setTimeout(() => {
				this.open = false;
				this.#openReason = null;
				if (isBlur) this.#clickedTrigger = false;
				this.#closeTimeout = null;
			}, this.closeDelay);
		}
	}

	#handleScroll(e: Event) {
		if (!this.open) return;

		const target = e.target;
		if (!(target instanceof Element) && !(target instanceof Document)) return;

		const triggerEl = document.getElementById(this.#ids.trigger);
		if ((triggerEl && target.contains(triggerEl)) || this.open) {
			this.#closeTooltip();
		}
	}
}
