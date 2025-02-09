import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import {
	SelectionState,
	type MaybeMultiple,
	type OnMultipleChange,
} from "$lib/utils/selection-state.svelte";
import type { ComputePositionConfig } from "@floating-ui/dom";
import { Popover, type PopoverProps } from "./Popover.svelte";
import { omit } from "$lib/utils/object";
import { kbd } from "$lib/utils/keyboard";
import { isHtmlElement, isString, isSvelteSet } from "$lib/utils/is";
import type { HTMLButtonAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("select", [
	"trigger",
	"content",
	"option",
]);

export type SelectProps<T extends string, Multiple extends boolean = false> = PopoverProps & {
	/**
	 * If `true`, multiple options can be selected at the same time.
	 *
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;

	/**
	 * The value for the Select.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	value?: MaybeMultiple<T, Multiple>;
	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: OnMultipleChange<T, Multiple>;

	/**
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;
};

export class Select<T extends string, Multiple extends boolean = false> extends Popover {
	/* Props */
	#props!: SelectProps<T, Multiple>;

	/* State */
	#value!: SelectionState<T, Multiple>;
	multiple = $derived(extract(this.#props.multiple, false as Multiple));

	constructor(props: SelectProps<T, Multiple> = {}) {
		super({
			...props,
			onOpenChange: (o) => {
				props.onOpenChange?.(o);
				if (!o) return;

				const content = document.getElementById(this.ids.content);
				if (!content) return;

				const options = [...content.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);

				let toFocus = options[0];
				if (isString(this.value)) {
					toFocus = options.find((o) => o.dataset.value === this.value) ?? toFocus;
				} else if (isSvelteSet(this.value)) {
					const value = this.value.values().next().value;
					toFocus = options.find((o) => (o.dataset.value = value)) ?? toFocus;
				}
				toFocus.focus();
			},
		});

		this.#props = props;
		this.#value = new SelectionState({
			value: props.value,
			onChange: props.onValueChange,
			multiple: this.multiple,
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	get trigger() {
		return Object.assign(super.trigger, {
			[dataAttrs.trigger]: "",
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ARROW_DOWN) this.open = true;
			},
		});
	}

	get content() {
		return Object.assign(super.content, {
			[dataAttrs.content]: "",
		});
	}

	getOption(value: T) {
		return {
			[dataAttrs.option]: "",
			"data-value": dataAttr(value),
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ARROW_DOWN) {
					e.preventDefault();
					this.getNextOptionEl(value)?.focus();
				} else if (e.key === kbd.ARROW_UP) {
					e.preventDefault();
					this.getPrevOptionEl(value)?.focus();
				}
			},
			onclick: () => {
				this.#value.add(value);
				if (!this.multiple) this.open = false;
			},
		} as const satisfies HTMLButtonAttributes;
	}

	getNextOptionEl(value: T) {
		const contentEl = document.getElementById(this.ids.content);
		if (!contentEl) return;

		const options = [...contentEl.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);
		const index = options.findIndex((o) => o.dataset.value === value);
		return options[index + 1] ?? options[0];
	}

	getPrevOptionEl(value: T) {
		const contentEl = document.getElementById(this.ids.content);
		if (!contentEl) return;

		const options = [...contentEl.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);
		const index = options.findIndex((o) => o.dataset.value === value);
		return options[index - 1] ?? options[options.length - 1];
	}
}

