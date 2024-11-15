import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { addEventListener } from "$lib/utils/event";
import { extract } from "$lib/utils/extract.svelte";
import { createDataIds, createIds } from "$lib/utils/identifiers.svelte";
import { isHtmlElement } from "$lib/utils/is";
import { deepMerge } from "$lib/utils/merge";
import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
	type ComputePositionConfig,
	type Placement,
} from "@floating-ui/dom";
import { useEventListener } from "runed";
import type { HTMLAttributes } from "svelte/elements";

const dataIds = createDataIds("popover", ["trigger", "content"]);

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
	open?: MaybeGetter<boolean>;

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
};

export class Popover {
	#ids = createIds(dataIds);

	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	computePositionOptions = $derived(extract(this.#props.computePositionOptions, {}));

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

	get #sharedProps() {
		return {
			onfocusout: async () => {
				await new Promise((r) => setTimeout(r));
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

	/** The trigger that toggles the value. */
	get trigger() {
		return {
			[dataIds.trigger]: "",
			id: this.#ids.trigger,
			popovertarget: this.#ids.content,
			onclick: (e: Event) => {
				e.preventDefault();
				this.open = !this.open;
			},
			...this.#sharedProps,
		} as const;
	}

	get content() {
		// Show and hide popover based on open state
		$effect(() => {
			const el = document.getElementById(this.#ids.content);
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
			const contentEl = document.getElementById(this.#ids.content);
			const triggerEl = document.getElementById(this.#ids.trigger);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			const baseOptions: Partial<ComputePositionConfig> = {
				middleware: [shift(), flip(), offset({ mainAxis: 8 })],
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
				});
				contentEl.style.transformOrigin = transformOriginMap[placement];

				contentEl.dataset.side = placement;
			});
		};

		$effect(() => {
			const contentEl = document.getElementById(this.#ids.content);
			const triggerEl = document.getElementById(this.#ids.trigger);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			return autoUpdate(triggerEl, contentEl, compute);
		});

		useEventListener(
			() => document,
			"keydown",
			(e) => {
				const el = document.getElementById(this.#ids.content);
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
				const contentEl = document.getElementById(this.#ids.content);
				const triggerEl = document.getElementById(this.#ids.trigger);

				if (
					this.open &&
					!contentEl?.contains(e.target as Node) &&
					!triggerEl?.contains(e.target as Node)
				) {
					this.open = false;
				}
			},
		);

		return {
			[dataIds.content]: "",
			id: this.#ids.content,
			popover: "manual",
			ontoggle: (e) => {
				const newOpen = e.newState === "open";
				if (this.open !== newOpen && newOpen === false) {
					this.open = newOpen;
				}
			},
			tabindex: -1,
			inert: !this.open,
			"data-open": dataAttr(this.open),
			...this.#sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
