import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract.svelte";
import { createIdentifiers } from "$lib/utils/identifiers.svelte";
import { isHtmlElement } from "$lib/utils/is";
import { nanoid } from "nanoid";
import { useEventListener } from "runed";

const identifiers = createIdentifiers("popover", ["trigger", "content"]);

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
	forceVisible?: MaybeGetter<boolean>;
};

let popoverCount = 0;

export class Popover {
	#id = nanoid();
	#triggerId = `${this.#id}-trigger`;
	#contentId = `${this.#id}-content`;

	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));

	/* State */
	#open!: Synced<boolean>;
	#count = popoverCount++;

	constructor(props: PopoverProps = {}) {
		this.#open = new Synced(props.open ?? false, props.onOpenChange);
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
			id: this.#triggerId,
			[identifiers.trigger]: "",
			popovertarget: this.#contentId,
			onclick: (e: Event) => {
				e.preventDefault();
				this.open = !this.open;
			},
		} as const;
	}

	get content() {
		$effect(() => {
			const el = document.getElementById(this.#contentId);
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
				if (e.key === "Escape" && this.open) {
					e.preventDefault();
					this.open = false;
				}
			},
		);

		useEventListener(
			() => document,
			"click",
			(e) => {
				const contentEl = document.getElementById(this.#contentId);
				const triggerEl = document.getElementById(this.#triggerId);
				console.log(this.#count, this.open);

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
			id: this.#contentId,
			[identifiers.content]: "",
			popover: "manual",
		};
	}
}
