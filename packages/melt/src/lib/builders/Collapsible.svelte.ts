import { extract } from "$lib/utils/extract";

import type { MaybeGetter } from "$lib/types";
import { Synced } from "$lib/Synced.svelte";
import { dataAttr } from "$lib/utils/attribute";

export type CollapsibleProps = {
	/**
	 * Whether the collapsible is disabled which prevents it from being opened.
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the collapsible is open.
	 */
	open?: MaybeGetter<boolean>;

	/**
	 * Whether the collapsible is open by default.
	 */
	defaultOpen?: MaybeGetter<boolean | undefined>;

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

    constructor(props: CollapsibleProps) {
        this.#props = props;
        this.#open = new Synced({
            value: props.open,
            onChange: props.onOpenChange,
            defaultValue: extract(props.disabled, false)
        });
    }

    get open() {
        return this.#open.current;
    }

	get #sharedAttrs() {
		return {
			'data-state': this.open ? 'open' : 'closed',
            'data-disabled': dataAttr(this.disabled)
		};
	}

    get root() {
        return this.#sharedAttrs;
    }

    get trigger() {
        return {
            ...this.#sharedAttrs,
            disabled: this.disabled,
            onclick: () => {
                if (this.disabled) return;

                this.#open.current = !this.#open.current;
            }
        };
    }

    get content() {
        return this.#sharedAttrs;
    }
}