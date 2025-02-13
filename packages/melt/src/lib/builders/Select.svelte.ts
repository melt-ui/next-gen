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
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
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
	highlighted: T | null = $state(null);

	constructor(props: SelectProps<T, Multiple> = {}) {
		super({
			...props,
			onOpenChange: async (open) => {
				props.onOpenChange?.(open);
				await tick();
				if (!open) this.highlighted = null;
				this.highlighted = this.#value.toArray().at(-1) ?? null;

				const content = document.getElementById(this.ids.content);
				if (!content) return;
				content.focus();
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
		});
	}

	get content() {
		return Object.assign(super.content, {
			[dataAttrs.content]: "",

			onclick: (e) => {
				e.preventDefault();
				e.stopPropagation();
			},

			onkeydown: (e: KeyboardEvent) => {
				const kbdSubset = pick(kbd, "HOME", "END", "ARROW_DOWN", "ARROW_UP");
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
				}
			},
		} as const satisfies HTMLAttributes<HTMLDivElement>);
	}

	getOption(value: T) {
		return {
			[dataAttrs.option]: "",
			"data-value": dataAttr(value),
			"aria-hidden": this.open ? undefined : true,
			"aria-selected": this.#value.has(value),
			"data-highlighted": this.highlighted === value,
			// disabled: this.open ? undefined : true,
			role: "option",
			onmouseover: (e) => {
				this.highlighted = value;
			},
			onclick: () => {
				console.log("click!", value);
				this.#value.toggle(value);
				if (!this.multiple) this.open = false;
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

	#highlightOptionEl(el: HTMLElement) {
		this.#highlight(el);
		el.scrollIntoView({ block: "nearest" });
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
