import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract.svelte";
import { createIdentifiers } from "$lib/utils/identifiers.svelte";
import { getPopoverAttributes, getPopoverTriggerAttributes } from "$lib/utils/popover.svelte";
import { nanoid } from "nanoid";

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
	forceVisible?: MaybeGetter<boolean | undefined>;
};

export class Popover {
	#id = nanoid();
	#triggerId = `${this.#id}-trigger`;
	#contentId = `${this.#id}-content`;

	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));

	/* State */
	#open!: Synced<boolean>;

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
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const instance = this;
		const attributes = getPopoverTriggerAttributes({
			contentId: instance.#contentId,
			triggerId: instance.#triggerId,
			get open() {
				return instance.open;
			},
			set open(value) {
				instance.open = value;
			},
			get forceVisible() {
				return instance.forceVisible;
			},
		});

		return {
			[identifiers.trigger]: "",
			...attributes
		} as const;
	}

	get content() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const instance = this;
		const attributes = getPopoverAttributes({
			contentId: instance.#contentId,
			triggerId: instance.#triggerId,
			get open() {
				return instance.open;
			},
			set open(value) {
				instance.open = value;
			},
			get forceVisible() {
				return instance.forceVisible;
			},
		});

		return {
			[identifiers.content]: "",
			...attributes,
		} as const;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
