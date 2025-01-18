import { SelectionState, type MaybeMultiple, type OnSelectChange } from "$lib/utils/selection-state.svelte";
import { kbd } from "$lib/utils/keyboard";
import type { FalseIfUndefined } from "$lib/utils/types";
import type { MaybeGetter, Getter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { createDataIds, createIds } from "../utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";

const identifiers = createDataIds("accordion", ["root", "item", "trigger", "heading", "content"]);

type AccordionValue<Multiple extends boolean> = MaybeMultiple<Multiple>;
type Selected<Multiple extends boolean | undefined> = SelectionState<FalseIfUndefined<Multiple>>;

/**
 * Represents an accordion item with optional metadata.
 * @template Meta - Type of additional metadata properties for the accordion item.
 */
export type AccordionItem<Meta extends Record<string, unknown> = Record<never, never>> = {
	/** Unique identifier for the accordion item. */
	id: string;
	/** Disables the accordion item. */
	disabled?: boolean;
} & Meta;

/**
 * Props for the configuration of the Accordion builder.
 * @template Items - Array type extending AccordionItem.
 * @template Multiple - Boolean indicating if multiple selection is enabled.
 */
export type AccordionProps<Items extends AccordionItem[], Multiple extends boolean = false> = {
	/**
	 * If `true`, multiple accordion items can be open at the same time.
	 *
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;

	/**
	 * When `true`, prevents the user from interacting with the accordion.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * The controlled value for the accordion.
	 */
	value?: AccordionValue<Multiple>;

	/**
	 * The items contained in the accordion.
	 */
	items: Getter<Items>;

	/**
	 * The callback invoked when the value of the Accordion changes.
	 */
	onValueChange?: OnSelectChange<Multiple>;
};

export class Accordion<Items extends AccordionItem[], Multiple extends boolean = false> {
	// Props
	#props!: AccordionProps<Items, Multiple>;
	// readonly items = $derived(extract(this.#props.items));
	readonly multiple = $derived(extract(this.#props.multiple, false as Multiple));
	readonly disabled = $derived(extract(this.#props.disabled, false));

	// State
	#value: Selected<Multiple>;
	#ids = createIds(identifiers);

	constructor(props: AccordionProps<Items, Multiple>) {
		this.#props = props;
		this.#value = new SelectionState({
			value: props.value,
			onChange: props.onValueChange,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			multiple: props.multiple as any
		}) as Selected<Multiple>;
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	get root() {
		return {
			[identifiers.root]: "",
			id: this.#ids.root
		};
	}

	get items() {
		return extract(this.#props.items).map((item) => new Item({
			accordion: this,
			item,
			rootId: this.#ids.root
		}));
	}

	/**
	 * Checks if an item is currently expanded.
	 * @param id - ID of the item to check.
	 */
	isExpanded(id: string) {
		return this.#value.has(id);
	}

	/**
	 * Expands a specific item.
	 * @param id - ID of the item to expand.
	 */
	expand(id: string) {
		this.#value.add(id);
	}

	/**
	 * Collapses a specific item.
	 * @param id - ID of the item to collapse.
	 */
	collapse(id: string) {
		this.#value.delete(id);
	}

	/**
	 * Toggles the expanded state of an item.
	 * @param id - ID of the item to toggle.
	 */
	toggleExpanded(id: string) {
		this.#value.toggle(id);
	}
}

type ItemProps<Items extends AccordionItem[], Multiple extends boolean = false> = {
	accordion: Accordion<Items, Multiple>;
	item: Items[0];
	rootId: string;
};

class Item<Items extends AccordionItem[], Multiple extends boolean = false> {
	#props!: ItemProps<Items, Multiple>;
	readonly item = $derived(this.#props.item);
	#accordion = $derived(this.#props.accordion);
	#rootId = $derived(this.#props.rootId);

	/** Check if this item is disabled. */
	isDisabled = () => this.#accordion.disabled || this.item.disabled;
	/** Check if this item is selected. */
	isExpanded = () => this.#accordion.isExpanded(this.item.id);
	/** Selects this item. */
	expand = () => this.#accordion.expand(this.item.id);
	/** Deselects this item. */
	collapse = () => this.#accordion.collapse(this.item.id);
	/** Toggles the selected state of this item. */
	toggleExpand = () => this.#accordion.toggleExpanded(this.item.id);	
	
	constructor(props: ItemProps<Items, Multiple>) {
		this.#props = props;
	}

	/**
	 * Spread attributes for an accordion item trigger.
	 */
	get trigger() {
		return {
			[identifiers.trigger]: "",
			disabled: disabledAttr(this.isDisabled()),
			'aria-disabled': this.isDisabled(),
			'aria-expanded': this.isExpanded(),
			'data-disabled': dataAttr(this.isDisabled()),
			'data-value': this.item.id,
			'data-state': this.isExpanded() ? 'open' : 'closed',
			onclick: () => this.toggleExpand(),
			onkeydown: (e: KeyboardEvent) => {
				const key = e.key;

				if (![kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.HOME, kbd.END].includes(key)) {
					return;
				}

				e.preventDefault();

				if (key === kbd.SPACE || key === kbd.ENTER) {
					if (this.isDisabled()) return;
					this.toggleExpand();
				}

				const rootEl = document.getElementById(this.#rootId);
				if (!rootEl || !isHtmlElement(rootEl)) return;

				const items = Array.from(rootEl.querySelectorAll(`[${identifiers.trigger}]`));

				console.log('items:', items);

				// const candidateItems = items.filter((item): item is HTMLElement => {
				// 	if (!isHTMLElement(item)) return false;
				// 	return item.dataset.disabled !== 'true';
				// });


			}
		};
	}

	// TODO
	get content() {
		return {};
	}
}