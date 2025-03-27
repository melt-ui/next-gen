import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { kbd } from "$lib/utils/keyboard";
import { pick } from "$lib/utils/object";
import {
	SelectionState,
	type MaybeMultiple,
	type OnMultipleChange,
} from "$lib/utils/selection-state.svelte";
import { createTypeahead, letterRegex } from "$lib/utils/typeahead.svelte";
import { tick } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { BasePopover, type PopoverProps } from "./Popover.svelte";
import { findNext, findPrev } from "$lib/utils/array";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("select", [
	"trigger",
	"content",
	"option",
]);

export type SelectProps<T extends string, Multiple extends boolean = false> = Omit<
	PopoverProps,
	"sameWidth"
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

	/**
	 * How many time (in ms) the typeahead string is held before it is cleared
	 * @default 500
	 */
	typeaheadTimeout?: MaybeGetter<number | undefined>;

	/**
	 * If the content should have the same width as the trigger
	 *
	 * @default true
	 */
	sameWidth?: MaybeGetter<boolean | undefined>;
};

export class Select<T extends string, Multiple extends boolean = false> extends BasePopover {
	/* Props */
	#props!: SelectProps<T, Multiple>;

	/* State */
	#value!: SelectionState<T, Multiple>;
	multiple = $derived(extract(this.#props.multiple, false as Multiple));
	highlighted: T | null = $state(null);

	declare ids: ReturnType<typeof createIds> & BasePopover["ids"];

	readonly typeaheadTimeout = $derived(extract(this.#props.typeaheadTimeout, 500));
	readonly typeahead = $derived(
		createTypeahead({
			timeout: this.#props.typeaheadTimeout,
			getItems: () => {
				return this.#getOptionsEls().reduce(
					(acc, curr) => {
						if (!curr.dataset.value) return acc;
						return [
							...acc,
							{
								value: curr.dataset.value as T,
								typeahead: curr.dataset.typeahead,
								current: curr.dataset.value === this.highlighted,
							},
						];
					},
					[] as Array<{ value: T; current: boolean }>,
				);
			},
		}),
	);

	constructor(props: SelectProps<T, Multiple> = {}) {
		super({
			sameWidth: true,
			...props,
			onOpenChange: async (open) => {
				props.onOpenChange?.(open);
				await tick();
				if (!open) {
					this.highlighted = null;
					return;
				}

				if (!this.highlighted) {
					const lastSelected = this.#value.toArray().at(-1);
					if (lastSelected) this.highlighted = lastSelected;
					else this.#highlightFirst();
				}

				const content = document.getElementById(this.ids.content);
				if (!content) return;
				content.focus();
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
			trigger: oldIds.invoker,
			content: oldIds.popover,
			option: newIds.option,
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

	select = (value: T) => {
		if (this.multiple) {
			this.#value.toggle(value);
			return;
		}
		this.#value.add(value);

		this.open = false;
		tick().then(() => {
			document.getElementById(this.ids.trigger)?.focus();
		});
	};

	get trigger() {
		return Object.assign(super.getInvoker(), {
			[dataAttrs.trigger]: "",
			role: "combobox",
			"aria-expanded": this.open,
			"aria-controls": this.ids.content,
			"aria-owns": this.ids.content,
			onkeydown: (e: KeyboardEvent) => {
				const kbdSubset = pick(kbd, "ARROW_DOWN", "ARROW_UP");
				if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();

				switch (e.key) {
					case kbdSubset.ARROW_DOWN: {
						this.open = true;
						tick().then(() => {
							if (!this.value) this.#highlightFirst();
						});
						break;
					}
					case kbdSubset.ARROW_UP: {
						this.open = true;
						tick().then(() => {
							if (!this.value) this.#highlightLast();
						});
						break;
					}
				}
			},
		});
	}

	get content() {
		return Object.assign(super.getPopover(), {
			[dataAttrs.content]: "",
			role: "listbox",
			"aria-expanded": this.open,
			"aria-activedescendant": this.highlighted ? this.getOptionId(this.highlighted) : undefined,
			onkeydown: (e: KeyboardEvent) => {
				const kbdSubset = pick(
					kbd,
					"HOME",
					"END",
					"ARROW_DOWN",
					"ARROW_UP",
					"ESCAPE",
					"ENTER",
					"SPACE",
				);
				if (Object.values(kbdSubset).includes(e.key as any)) e.preventDefault();

				switch (e.key) {
					case kbdSubset.HOME: {
						this.#highlightFirst();
						break;
					}
					case kbdSubset.END: {
						this.#highlightLast();
						break;
					}
					case kbdSubset.ARROW_DOWN: {
						this.#highlightNext();
						break;
					}
					case kbdSubset.ARROW_UP: {
						this.#highlightPrev();
						break;
					}
					case kbdSubset.SPACE:
					case kbdSubset.ENTER: {
						if (!this.highlighted) break;
						this.select(this.highlighted);
						break;
					}
					case kbdSubset.ESCAPE: {
						this.open = false;
						tick().then(() => {
							document.getElementById(this.ids.trigger)?.focus();
						});
						break;
					}
					default: {
						if (!letterRegex.test(e.key)) break;
						e.preventDefault();
						e.stopPropagation();
						const next = this.typeahead(e.key);
						if (next) this.highlighted = next.value;
					}
				}
			},
		} as const satisfies HTMLAttributes<HTMLDivElement>);
	}

	getOptionId(value: T) {
		return `${this.ids.content}-option-${dataAttr(value)}`;
	}

	getOption(value: T, options?: { typeahead: string }) {
		return {
			[dataAttrs.option]: "",
			"data-value": dataAttr(value),
			"data-typeahead": dataAttr(options?.typeahead),
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
		const next = findNext(options, (o) => o.dataset.value === this.highlighted);
		if (isHtmlElement(next)) this.#highlight(next);
	}

	#highlightPrev() {
		const options = this.#getOptionsEls();
		const prev = findPrev(options, (o) => o.dataset.value === this.highlighted);
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
