import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract.svelte";
import { createDataIds, createIds } from "$lib/utils/identifiers.svelte";
import { isHtmlElement } from "$lib/utils/is";
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
			onfocusout: async () => {
				await new Promise((r) => setTimeout(r));
				const contentEl = document.getElementById(this.#ids.content);

				if (!contentEl?.contains(document.activeElement)) {
					this.open = false;
				}
			},
		} satisfies HTMLAttributes<HTMLElement>;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
