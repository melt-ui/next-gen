import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { addEventListener } from "$lib/utils/event";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { isFunction, isHtmlElement } from "$lib/utils/is";
import { deepMerge } from "$lib/utils/merge";
import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
	size,
	type ComputePositionConfig,
	type Placement,
} from "@floating-ui/dom";
import { nanoid } from "nanoid";
import { useEventListener } from "runed";
import type { HTMLAttributes } from "svelte/elements";

const dataIds = createDataIds("popover", ["trigger", "content"]);

type CloseOnOutsideClickCheck = (el: Element | Window | Document) => boolean;
type CloseOnOutsideClickProp = MaybeGetter<boolean | undefined> | CloseOnOutsideClickCheck;

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
	 * Options to be passed to Floating UI's `computePosition`
	 *
	 * @see https://floating-ui.com/docs/computePosition
	 */
	computePositionOptions?: MaybeGetter<Partial<ComputePositionConfig> | undefined>;

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
	computePositionOptions = $derived(extract(this.#props.computePositionOptions, {}));
	closeOnEscape = $derived(extract(this.#props.closeOnEscape, true));
	sameWidth = $derived(extract(this.#props.sameWidth, false));

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
		const closeOnOutsideClick = this.#props.closeOnOutsideClick;

		if (closeOnOutsideClick === false) return false;

		if (isFunction(closeOnOutsideClick)) {
			return isCloseOnOutsideClickCheck(closeOnOutsideClick)
				? closeOnOutsideClick(el as HTMLElement) // Pass target if it's the correct type
				: closeOnOutsideClick(); // Otherwise, call without arguments
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
		$effect(() => {
			const el = document.getElementById(this.ids.popover);
			if (!isHtmlElement(el)) {
				return;
			}

			if (this.open || this.forceVisible) {
				// Check if there's a parent popover. If so, only open if the parent's open.
				// This is to guarantee correct layering.
				const parent = isHtmlElement(el.parentNode)
					? el.parentNode.closest(`[${dataIds.content}]`)
					: undefined;

				if (!isHtmlElement(parent)) {
					el.showPopover();
					return;
				}

				if (parent.dataset.open !== undefined) el.showPopover();

				return addEventListener(parent, "toggle", async (e) => {
					await new Promise((r) => setTimeout(r));

					const isOpen = e.newState === "open";
					if (isOpen) {
						el.showPopover();
					} else {
						el.hidePopover();
					}
				});
			} else {
				el.hidePopover();
			}
		});

		// Floating UI
		const compute = () => {
			const contentEl = document.getElementById(this.ids.popover);
			const triggerEl = document.getElementById(this.ids.invoker);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			const baseOptions: Partial<ComputePositionConfig> = {
				middleware: [
					shift(),
					flip(),
					offset({ mainAxis: 8 }),
					this.sameWidth
						? size({
								apply({ rects, elements }) {
									Object.assign(elements.floating?.style ?? {}, {
										width: `${rects.reference.width}px`,
										minWidth: `${rects.reference.width}px`,
									});
								},
							})
						: undefined,
				],
			};
			computePosition(
				triggerEl,
				contentEl,
				deepMerge(baseOptions, this.computePositionOptions),
			).then(({ x, y, placement }) => {
				const transformOriginMap: Record<Placement, string> = {
					top: "bottom center",
					"top-start": "bottom left",
					"top-end": "bottom right",

					bottom: "top center",
					"bottom-start": "top left",
					"bottom-end": "top right",

					left: "center center",
					"left-start": "top left",
					"left-end": "bottom left",

					right: "center center",
					"right-start": "top right",
					"right-end": "bottom right",
				};

				Object.assign(contentEl.style, {
					left: `${x}px`,
					top: `${y}px`,
					position: "absolute",
				});
				contentEl.style.transformOrigin = transformOriginMap[placement];

				contentEl.dataset.side = placement;
			});
		};

		$effect(() => {
			const contentEl = document.getElementById(this.ids.popover);
			const triggerEl = document.getElementById(this.ids.invoker);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			return autoUpdate(triggerEl, contentEl, compute);
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
					if (child.matches(`[${dataIds.content}]`)) return child.dataset.open !== undefined;
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
			[dataIds.trigger]: "",
		});
	}

	get content() {
		return Object.assign(this.getPopover(), {
			[dataIds.content]: "",
		});
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
