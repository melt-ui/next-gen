import { Synced } from "$lib/Synced.svelte.js";
import type { MaybeGetter } from "$lib/types.js";
import { extract } from "$lib/utils/extract.svelte.js";
import { createDataIds, createIds } from "$lib/utils/identifiers.svelte.js";
import { getPopoverAttributes, getPopoverTriggerAttributes } from "$lib/utils/popover.svelte.js";

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
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const instance = this;
		const attributes = getPopoverTriggerAttributes({
			contentId: instance.#ids.content,
			triggerId: instance.#ids.trigger,
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
			[dataIds.trigger]: "",
			...attributes,
		} as const;
	}

	get content() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const instance = this;
		const attributes = getPopoverAttributes({
			contentId: instance.#ids.content,
			triggerId: instance.#ids.trigger,
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
			[dataIds.content]: "",
			...attributes,
		} as const;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
