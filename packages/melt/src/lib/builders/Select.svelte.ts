import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { findNext, findPrev, mapAndFilter } from "$lib/utils/array";
import { dataAttr, idAttr } from "$lib/utils/attribute";
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
import { unique } from "$lib/utils/string";
import { createTypeahead, letterRegex } from "$lib/utils/typeahead.svelte";
import { dequal } from "dequal";
import { tick } from "svelte";
import type { HTMLAttributes, HTMLLabelAttributes } from "svelte/elements";
import { BasePopover, type PopoverProps } from "./Popover.svelte";
import { createAttachmentKey } from "svelte/attachments";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("select", [
	"trigger",
	"content",
	"option",
]);

export type SelectProps<T, Multiple extends boolean = false> = Omit<PopoverProps, "sameWidth"> & {
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
	 * The currently highlighted value.
	 */
	highlighted?: MaybeGetter<T | null | undefined>;

	/**
	 * Called when the highlighted value changes.
	 */
	onHighlightChange?: (highlighted: T | null) => void;

	/**
	 * Custom navigation handler for virtualized lists.
	 * When provided, this will be used instead of DOM-based navigation.
	 *
	 * @param current - The currently highlighted item
	 * @param direction - The navigation direction ('next' or 'prev')
	 * @returns The next item to highlight, or null if navigation should be handled by default behavior
	 */
	onNavigate?: (current: T | null, direction: "next" | "prev") => T | null;

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

	/**
	 * Determines behavior when scrolling items into view.
	 * Set to null to disable auto-scrolling.
	 *
	 * @default "nearest"
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#block
	 */
	scrollAlignment?: MaybeGetter<"nearest" | "center" | null | undefined>;
};

export class Select<T, Multiple extends boolean = false> extends BasePopover {
	#props!: SelectProps<T, Multiple>;
	multiple = $derived(extract(this.#props.multiple, false as Multiple));
	scrollAlignment = $derived(extract(this.#props.scrollAlignment, "nearest"));

	/* State */
	#value!: SelectionState<T, Multiple>;
	#highlighted: Synced<T | null>;

	declare ids: ReturnType<typeof createIds> & BasePopover["ids"];

	readonly typeaheadTimeout = $derived(extract(this.#props.typeaheadTimeout, 500));
	readonly typeahead = $derived(
		createTypeahead({
			timeout: this.#props.typeaheadTimeout,
			getItems: () => {
				return mapAndFilter(
					this.#getOptionsEls(),
					(curr) => {
						return {
							value: curr.dataset.value ? JSON.parse(curr.dataset.value ?? "") : ("" as T),
							typeahead: curr.dataset.label as string,
							current: curr.dataset.value === JSON.stringify(this.highlighted),
						};
					},
					(v) => {
						return !!v.value;
					},
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
				tick().then(() => {
					content.focus();
				});
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
			trigger: newIds.trigger,
			content: oldIds.popover,
			option: newIds.option,
		};
	}

	getOptionLabel = (value: T) => {
		const key = unique(value);
		if (this.#valueLabelMap.has(key)) {
			return this.#valueLabelMap.get(key)!;
		}

		return typeof value === "string" ? (value as string) : "";
	};

	#setOptionLabel(value: T, label: string) {
		return this.#valueLabelMap.set(unique(value), label);
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
		return this.#value.toArray().map(this.getOptionLabel).join(", ");
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

	get label() {
		return {
			for: this.ids.trigger,
			onclick: (e) => {
				e.preventDefault();
				document.getElementById(this.ids.trigger)?.focus();
			},
		} satisfies HTMLLabelAttributes;
	}

	#triggerAttachment = {
		[createAttachmentKey()]: (node) => {
			this.triggerEl = node;
			return () => {
				if (this.triggerEl === node) {
					this.triggerEl = null;
				}
			};
		},
	} as const satisfies HTMLAttributes<HTMLElement>;

	get trigger() {
		return Object.assign(super.getInvoker(), {
			[dataAttrs.trigger]: "",
			id: this.ids.trigger,
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
			...this.#triggerAttachment,
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
		return idAttr(unique(value));
	}

	#valueLabelMap = new Map<string, string>();

	getOption(value: T, label?: string) {
		if (label) this.#setOptionLabel(value, label);

		return {
			[dataAttrs.option]: "",
			"data-value": dataAttr(JSON.stringify(value)),
			"data-label": dataAttr(label ?? `${value}`),
			"aria-hidden": this.open ? undefined : true,
			"aria-selected": this.#value.has(value),
			"data-highlighted": dataAttr(dequal(this.highlighted, value)),
			role: "option",
			tabindex: -1,
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
		this.highlighted = JSON.parse(el.dataset.value) as T;

		if (this.scrollAlignment !== null) {
			el.scrollIntoView({ block: this.scrollAlignment });
		}
	}

	#highlightNext() {
		if (this.#props.onNavigate) {
			const next = this.#props.onNavigate(this.highlighted, "next");
			if (next !== null) {
				this.highlighted = next;
				// Try to scroll the element into view if it exists in DOM
				const id = this.getOptionId(next);
				const el = document.getElementById(id);
				if (el && this.scrollAlignment !== null) {
					el.scrollIntoView({ block: this.scrollAlignment });
				}
			}
			return;
		}

		// Fallback to current DOM-based implementation
		const options = this.#getOptionsEls();
		const next = findNext(options, (o) => o.dataset.value === JSON.stringify(this.highlighted));
		if (isHtmlElement(next)) this.#highlight(next);
	}

	#highlightPrev() {
		if (this.#props.onNavigate) {
			const prev = this.#props.onNavigate(this.highlighted, "prev");
			if (prev !== null) {
				this.highlighted = prev;
				// Try to scroll the element into view if it exists in DOM
				const id = this.getOptionId(prev);
				const el = document.getElementById(id);
				if (el && this.scrollAlignment !== null) {
					el.scrollIntoView({ block: this.scrollAlignment });
				}
			}
			return;
		}

		// Fallback to current DOM-based implementation
		const options = this.#getOptionsEls();
		const prev = findPrev(options, (o) => o.dataset.value === JSON.stringify(this.highlighted));
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
