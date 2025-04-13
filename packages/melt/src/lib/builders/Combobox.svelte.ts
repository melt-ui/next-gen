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
import { findNext, findPrev } from "$lib/utils/array";
import { Synced } from "$lib/Synced.svelte";
import { safeEffect } from "$lib/utils/effect.svelte";

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
	 * The value for the Combobox.
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
	 * The currently highlighted value.
	 */
	highlighted?: MaybeGetter<T | null | undefined>;

	/**
	 * Called when the highlighted value changes.
	 */
	onHighlightChange?: (highlighted: T | null) => void;

	/**
	 * Determines behavior when scrolling items into view.
	 * Set to null to disable auto-scrolling.
	 *
	 * @default "nearest"
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#block
	 */
	scrollAlignment?: MaybeGetter<"nearest" | "center" | null | undefined>;

	/**
	 * If the content should have the same width as the trigger
	 *
	 * @default true
	 */
	sameWidth?: MaybeGetter<boolean | undefined>;
};

export class Combobox<T extends string, Multiple extends boolean = false> extends BasePopover {
	/* Props */
	#props!: ComboboxProps<T, Multiple>;
	multiple = $derived(extract(this.#props.multiple, false as Multiple));
	scrollAlignment = $derived(extract(this.#props.scrollAlignment, "nearest"));

	/* State */
	#value!: SelectionState<T, Multiple>;
	inputValue = $state("");
	#highlighted: Synced<T | null>;
	touched = $state(false);
	onSelectMap = new Map<T, () => void>();

	declare ids: ReturnType<typeof createIds> & BasePopover["ids"];

	constructor(props: ComboboxProps<T, Multiple> = {}) {
		super({
			sameWidth: true,
			...props,
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
					if (!this.multiple) {
						this.inputValue = this.valueAsString ?? "";
					}
					return;
				}

				tick().then(() => {
					if (this.highlighted) return;
					const lastSelected = this.#value.toArray().at(-1);
					if (lastSelected) this.highlight(lastSelected);
					else this.highlightFirst();
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

		this.#highlighted = new Synced({
			value: props.highlighted,
			onChange: props.onHighlightChange,
			defaultValue: null,
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

	get highlighted() {
		return this.#highlighted.current;
	}

	set highlighted(v) {
		this.#highlighted.current = v;
	}

	get valueAsString() {
		return this.#value.toArray().join(", ");
	}

	isSelected = (value: T) => {
		return this.#value.has(value);
	};

	select(value: T) {
		const onSelect = this.onSelectMap.get(value);
		if (!this.isSelected(value) && onSelect) {
			onSelect();
			return;
		}

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
				tick().then(() => this.highlightFirst());
				this.touched = true;
			},
			onkeydown: (e: KeyboardEvent) => {
				if (this.open) {
					const kbdSubset = pick(kbd, "ARROW_DOWN", "ARROW_UP", "ESCAPE", "ENTER");
					if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();

					switch (e.key) {
						case kbdSubset.ARROW_DOWN: {
							this.highlightNext();
							break;
						}
						case kbdSubset.ARROW_UP: {
							this.highlightPrev();
							break;
						}
						case kbdSubset.ESCAPE: {
							this.open = false;
							break;
						}
						case kbdSubset.ENTER: {
							if (this.highlighted === null) return;
							this.select(this.highlighted);
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
								return this.highlightNext();
							}
							this.open = true;
							tick().then(() => {
								if (!this.value) this.highlightFirst();
							});
							break;
						}
						case kbdSubset.ARROW_UP: {
							if (this.open) {
								return this.highlightNext();
							}
							this.open = true;
							tick().then(() => {
								if (!this.value) this.highlightLast();
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

	scrollIntoView(value?: T) {
		if (this.scrollAlignment === null) return;
		const v = value ?? this.highlighted;
		if (!v) return;
		const id = this.getOptionId(v);
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ block: this.scrollAlignment });
	}

	getOptionId(value: T) {
		return `${this.ids.content}-option-${dataAttr(value)}`;
	}

	/**
	 * Gets the attributes for the option element.
	 * @param value The value of the option.
	 * @param onSelect An optional callback to call when the option is selected, overriding the default behavior.
	 * @returns The attributes for the option element.
	 */
	getOption(value: T, onSelect?: () => void) {
		safeEffect(() => {
			if (onSelect) this.onSelectMap.set(value, onSelect);
			return () => {
				this.onSelectMap.delete(value);
			};
		});

		return {
			id: this.getOptionId(value),
			[dataAttrs.option]: "",
			"data-value": dataAttr(value),
			"aria-hidden": this.open ? undefined : true,
			"aria-selected": this.#value.has(value),
			"data-highlighted": dataAttr(this.highlighted === value),
			role: "option",
			onmouseover: () => {
				this.highlighted = value;
			},
			onclick: () => {
				this.select(value);
			},
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	getOptionsEls(): HTMLElement[] {
		const contentEl = document.getElementById(this.ids.content);
		if (!contentEl) return [];

		return [...contentEl.querySelectorAll(dataSelectors.option)].filter(isHtmlElement);
	}

	getOptions(): T[] {
		const els = this.getOptionsEls();
		return els.map((el) => el.dataset.value as T);
	}

	highlight(value: T) {
		this.highlighted = value;
		this.scrollIntoView(value);
	}

	highlightNext() {
		const options = this.getOptions();
		const next = findNext(options, (v) => v === this.highlighted);
		if (next !== undefined) this.highlight(next);
	}

	highlightPrev() {
		const options = this.getOptions();
		const prev = findPrev(options, (v) => v === this.highlighted);
		if (prev !== undefined) this.highlight(prev);
	}

	highlightFirst() {
		const first = this.getOptions()[0];
		if (first) this.highlight(first);
	}

	highlightLast() {
		const last = this.getOptions().at(-1);
		if (last) this.highlight(last);
	}
}
