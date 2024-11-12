import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract.svelte";
import { createDataIds, createIds } from "$lib/utils/identifiers.svelte";
import { isHtmlElement } from "$lib/utils/is";
import { deepMerge } from "$lib/utils/merge";
import {
	autoUpdate,
	computePosition,
	flip,
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
	computePositionOptions?: Partial<ComputePositionConfig>;
};

export class Popover {
	#ids = createIds(dataIds);

	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));

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
		} as const;
	}

	get content() {
		$effect(() => {
			const el = document.getElementById(this.#ids.content);
			if (!isHtmlElement(el)) {
				return;
			}

			if (this.open || this.forceVisible) {
				el.showPopover();
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
				middleware: [shift(), flip()],
			};
			computePosition(
				triggerEl,
				contentEl,
				deepMerge(baseOptions, this.#props.computePositionOptions || {}),
			).then(({ x, y, placement }) => {
				const transformOriginMap: Record<Placement, string> = {
					top: "top center",
					"top-start": "top left",
					"top-end": "top right",

					bottom: "bottom center",
					"bottom-start": "bottom left",
					"bottom-end": "bottom right",

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
					"--melt-popover-content-transform-origin": transformOriginMap[placement],
				});

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
				if (this.open !== newOpen) {
					this.open = newOpen;
				}
			},
			//onfocusout: async () => {
			//	await new Promise((r) => setTimeout(r));
			//	console.log("focus out", document.activeElement);
			//	const contentEl = document.getElementById(this.#ids.content);
			//
			//	if (!contentEl?.contains(document.activeElement)) {
			//		this.open = false;
			//	}
			//},
		} satisfies HTMLAttributes<HTMLElement>;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
