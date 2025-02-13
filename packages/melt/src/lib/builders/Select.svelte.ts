import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement, isString, isSvelteSet } from "$lib/utils/is";
import { kbd } from "$lib/utils/keyboard";
import {
	SelectionState,
	type MaybeMultiple,
	type OnMultipleChange,
} from "$lib/utils/selection-state.svelte";
import { tick } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import { Popover, type PopoverProps } from "./Popover.svelte";
import { pick } from "$lib/utils/object";

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
			onOpenChange: async (o) => {
				props.onOpenChange?.(o);
				await tick();
				if (!o) {
					const trigger = document.getElementById(this.ids.trigger);
					trigger?.focus();
					return;
				}

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
				if (e.key === kbd.ARROW_DOWN) {
					e.preventDefault();
					this.open = true;
				}
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
			"aria-hidden": this.open ? undefined : true,
			"aria-selected": this.#value.has(value),
			disabled: this.open ? undefined : true,
			tabindex: this.open ? 0 : -1,
			role: "option",
			onkeydown: (e: KeyboardEvent) => {
				const kbdSubset = pick(kbd, "HOME", "END", "ARROW_DOWN", "ARROW_UP");
				if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();

				switch (e.key) {
					case kbdSubset.HOME: {
						this.#getOptionsEls()[0]?.focus();
						break;
					}
					case kbdSubset.END: {
						this.#getOptionsEls().at(-1)?.focus();
						break;
					}
					case kbdSubset.ARROW_DOWN: {
						this.#getNextOptionEl(value)?.focus();
						break;
					}
					case kbdSubset.ARROW_UP: {
						this.#getPrevOptionEl(value)?.focus();
						break;
					}
				}
			},
			onclick: () => {
				this.#value.add(value);
				if (!this.multiple) this.open = false;
			},
		} as const satisfies HTMLButtonAttributes;
	}

	#getOptionsEls(): HTMLElement[] {
		const contentEl = document.getElementById(this.ids.content);
		if (!contentEl) return [];

		return [...contentEl.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);
	}

	#getNextOptionEl(value: T) {
		const options = this.#getOptionsEls();
		const index = options.findIndex((o) => o.dataset.value === value);
		return options[index + 1] ?? options[0];
	}

	#getPrevOptionEl(value: T) {
		const options = this.#getOptionsEls();
		const index = options.findIndex((o) => o.dataset.value === value);
		return options[index - 1] ?? options[options.length - 1];
	}
}
