import { extract } from "$lib/utils/extract";

import type { MaybeGetter } from "$lib/types";
import { Synced } from "$lib/Synced.svelte";
import { dataAttr } from "$lib/utils/attribute";
import { createBuilderMetadata } from "$lib/utils/identifiers";

const { dataAttrs, createIds } = createBuilderMetadata("collapsible", ["trigger", "content"]);

export type CollapsibleProps = {
	/**
	 * Whether the collapsible is disabled which prevents it from being opened.
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the collapsible is open.
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * A callback called when the value of `open` changes.
	 */
	onOpenChange?: (value: boolean) => void;
};

export class Collapsible {
	// Props
	#props!: CollapsibleProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));

	// State
	#open: Synced<boolean>;
	ids = $state(createIds());

	constructor(props: CollapsibleProps = {}) {
		this.#props = props;
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	/**
	 * The open state of the collapsible.
	 */
	get open() {
		return this.#open.current;
	}

	set open(open: boolean) {
		this.#open.current = open;
	}

	get #sharedAttrs() {
		return {
			"data-state": this.open ? "open" : "closed",
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * The spread attributes for the trigger button.
	 */
	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			id: this.ids.trigger,
			"aria-expanded": this.open,
			"aria-controls": this.ids.content,
			...this.#sharedAttrs,
			disabled: this.disabled,
			onclick: () => {
				if (this.disabled) return;

				this.#open.current = !this.#open.current;
			},
		} as const;
	}

	/**
	 * The spread attributes for the content element.
	 */
	get content() {
		return {
			[dataAttrs.content]: "",
			id: this.ids.content,
			...this.#sharedAttrs,
		} as const;
	}
}
