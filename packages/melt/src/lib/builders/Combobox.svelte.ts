import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement, isHtmlInputElement, isNode } from "$lib/utils/is";
import { kbd } from "$lib/utils/keyboard";
import { pick } from "$lib/utils/object";
import {
	SelectionState,
	type MaybeMultiple,
	type OnMultipleChange,
} from "$lib/utils/selection-state.svelte";
import { letterRegex } from "$lib/utils/typeahead.svelte";
import { tick } from "svelte";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import { BasePopover, type PopoverProps } from "./Popover.svelte";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("combobox", [
	"input",
	"trigger",
	"content",
	"option",
]);

export type ComboboxProps<T extends string, Multiple extends boolean = false> = Omit<
	PopoverProps,
	"closeOnEscape" | "closeOnOutsideClick" | "sameWidth"
> & {
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
};

export class Combobox<T extends string, Multiple extends boolean = false> extends BasePopover {
	/* Props */
	#props!: ComboboxProps<T, Multiple>;

	/* State */
	#value!: SelectionState<T, Multiple>;
	inputValue = $state("");
	multiple = $derived(extract(this.#props.multiple, false as Multiple));
	highlighted: T | null = $state(null);
	touched = $state(false);

	declare ids: ReturnType<typeof createIds> & BasePopover["ids"];

	constructor(props: ComboboxProps<T, Multiple> = {}) {
		super({
			...props,
			sameWidth: true,
			closeOnOutsideClick: (el) => {
				const triggerEl = document.getElementById(this.ids.trigger);
				if (triggerEl && isNode(el) && triggerEl.contains(el)) return false;
				return true;
			},
			closeOnEscape: () => this.open,
			onOpenChange: async (open) => {
				this.touched = false;
				props.onOpenChange?.(open);
				await tick();
				if (!open) {
					this.highlighted = null;
					return;
				}

				tick().then(() => {
					if (this.highlighted) return;
					const lastSelected = this.#value.toArray().at(-1);
					if (lastSelected) this.highlighted = lastSelected;
					else this.#highlightFirst();
				});

				// const content = document.getElementById(this.ids.content);
				// if (!content) return;
				// content.focus();
			},
		});

		this.#props = props;
		this.#value = new SelectionState({
			value: props.value,
			onChange: props.onValueChange,
			multiple: props.multiple,
		});

		const oldIds = this.ids;
		const newIds = createIds();
		this.ids = {
			...oldIds,
			input: oldIds.invoker,
			content: oldIds.popover,
			trigger: newIds.trigger,
		};
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	get valueAsString() {
		return this.#value.toArray().join(", ");
	}

	isSelected = (value: T) => {
		return this.#value.has(value);
	};

	select(value: T) {
		this.#value.toggle(value);
		if (this.multiple) {
			this.inputValue = "";
			return;
		}

		this.inputValue = this.valueAsString;

		this.open = false;
	}

	get input() {
		// using object.assign breaks types here
		return {
			...super.getInvoker(),
			[dataAttrs.input]: "",
			id: this.ids.input,
			role: "combobox",
			"aria-expanded": this.open,
			"aria-controls": this.ids.content,
			"aria-owns": this.ids.content,
			onclick: undefined,
			value: this.inputValue,
			oninput: (e: Event) => {
				const input = e.currentTarget;
				if (!isHtmlInputElement(input)) return;
				this.open = true;
				this.inputValue = input.value;
				tick().then(() => this.#highlightFirst());
				this.touched = true;
			},
			onkeydown: (e: KeyboardEvent) => {
				if (this.open) {
					const kbdSubset = pick(kbd, "ARROW_DOWN", "ARROW_UP", "ESCAPE", "ENTER");
					if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();

					switch (e.key) {
						case kbdSubset.ARROW_DOWN: {
							this.#highlightNext();
							break;
						}
						case kbdSubset.ARROW_UP: {
							this.#highlightPrev();
							break;
						}
						case kbdSubset.ESCAPE: {
							this.open = false;
							break;
						}
						case kbdSubset.ENTER: {
							if (this.highlighted === null) return;
							this.select(this.highlighted);
							if (!this.multiple) this.open = false;
							break;
						}
					}
				} else {
					const kbdSubset = pick(kbd, "ARROW_DOWN", "ARROW_UP", "ESCAPE");
					if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();
					else if (letterRegex.test(e.key)) this.open = true;

					switch (e.key) {
						case kbdSubset.ARROW_DOWN: {
							if (this.open) {
								return this.#highlightNext();
							}
							this.open = true;
							tick().then(() => {
								if (!this.value) this.#highlightFirst();
							});
							break;
						}
						case kbdSubset.ARROW_UP: {
							if (this.open) {
								return this.#highlightNext();
							}
							this.open = true;
							tick().then(() => {
								if (!this.value) this.#highlightLast();
							});
							break;
						}
						case kbdSubset.ESCAPE: {
							this.#value.clear();
							this.inputValue = "";
							break;
						}
					}
				}
			},
		} as const satisfies HTMLInputAttributes;
	}

	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			id: this.ids.trigger,
			onclick: () => {
				this.open = !this.open;
				document.getElementById(this.ids.input)?.focus();
			},
			...super.sharedProps,
		};
	}

	get content() {
		return Object.assign(super.getPopover(), {
			[dataAttrs.content]: "",
			role: "listbox",
			"aria-expanded": this.open,
			"aria-activedescendant": this.highlighted ? this.getOptionId(this.highlighted) : undefined,
		} as const satisfies HTMLAttributes<HTMLDivElement>);
	}

	getOptionId(value: T) {
		return `${this.ids.content}-option-${dataAttr(value)}`;
	}

	getOption(value: T) {
		return {
			[dataAttrs.option]: "",
			"data-value": dataAttr(value),
			"aria-hidden": this.open ? undefined : true,
			"aria-selected": this.#value.has(value),
			"data-highlighted": this.highlighted === value,
			role: "option",
			onmouseover: () => {
				this.highlighted = value;
			},
			onclick: () => {
				this.select(value);
			},
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	#getOptionsEls(): HTMLElement[] {
		const contentEl = document.getElementById(this.ids.content);
		if (!contentEl) return [];

		return [...contentEl.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);
	}

	#highlight(el: HTMLElement) {
		if (!el.dataset.value) return;
		this.highlighted = el.dataset.value as T;
	}

	#highlightNext() {
		const options = this.#getOptionsEls();
		const current = options.find((o) => o.dataset.value === this.highlighted);
		const next = current?.nextElementSibling ?? options[0];
		if (isHtmlElement(next)) this.#highlight(next);
	}

	#highlightPrev() {
		const options = this.#getOptionsEls();
		const current = options.find((o) => o.dataset.value === this.highlighted);
		const prev = current?.previousElementSibling ?? options.at(-1);
		if (isHtmlElement(prev)) this.#highlight(prev);
	}

	#highlightFirst() {
		const first = this.#getOptionsEls()[0];
		if (first) this.#highlight(first);
	}

	#highlightLast() {
		const last = this.#getOptionsEls().at(-1);

		if (last) this.#highlight(last);
	}
}
