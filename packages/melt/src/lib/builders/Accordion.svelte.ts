import { SelectionState, type OnMultipleChange } from "$lib/utils/selection-state.svelte";
import { kbd } from "$lib/utils/keyboard";
import type { FalseIfUndefined } from "$lib/utils/types";
import type { MaybeGetter, MaybeMultiple } from "$lib/types";
import { extract } from "$lib/utils/extract";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { createBuilderMetadata } from "../utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("accordion", [
	"root",
	"item",
	"trigger",
	"heading",
	"content",
]);

export type AccordionItemMeta<Meta extends Record<string, unknown> = Record<never, never>> = {
	/** Unique identifier for the accordion item. */
	id: string;
	/** Disables the accordion item. */
	disabled?: boolean;
	/** If the item has a header, this represents the level of the header. */
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
} & Meta;

type AccordionValue<Multiple extends boolean> = MaybeMultiple<string, Multiple>;
type Selected<Multiple extends boolean | undefined> = SelectionState<
	string,
	FalseIfUndefined<Multiple>
>;

/**
 * Props for the configuration of the Accordion builder.
 * @template Items - Array type extending AccordionItem.
 * @template Multiple - Boolean indicating if multiple selection is enabled.
 */
export type AccordionProps<Multiple extends boolean = false> = {
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
	 * The callback invoked when the value of the Accordion changes.
	 */
	onValueChange?: OnMultipleChange<string, Multiple>;
};

export class Accordion<Multiple extends boolean = false> {
	// Props
	#props!: AccordionProps<Multiple>;
	readonly multiple = $derived(extract(this.#props.multiple, false as Multiple));
	readonly disabled = $derived(extract(this.#props.disabled, false));

	// State
	#value: Selected<Multiple>;
	ids = $state(createIds());

	constructor(props: AccordionProps<Multiple> = {}) {
		this.#props = props;
		this.#value = new SelectionState({
			value: props.value,
			onChange: props.onValueChange,
			multiple: props.multiple,
		}) as Selected<Multiple>;
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	/**
	 * Spread attributes for the accordion root element.
	 */
	get root() {
		return {
			[dataAttrs.root]: "",
			id: this.ids.root,
		};
	}

	/**
	 * Returns an Item class with the necessary
	 * spread attributes for an accordion item.
	 * @param item
	 */
	getItem<Meta extends Record<string, unknown>>(item: AccordionItemMeta<Meta>) {
		return new AccordionItem({
			accordion: this,
			item,
			rootId: this.ids.root,
		});
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
		if (this.#value.has(id)) {
			this.collapse(id);
		} else {
			if (this.multiple) {
				this.expand(id);
			} else {
				this.#value.clear();
				this.expand(id);
			}
		}
	}
}

export type AccordionItemProps<
	Meta extends Record<string, unknown>,
	Multiple extends boolean = false,
> = {
	accordion: Accordion<Multiple>;
	item: AccordionItemMeta<Meta>;
	rootId: string;
};

export class AccordionItem<Meta extends Record<string, unknown>, Multiple extends boolean = false> {
	#props!: AccordionItemProps<Meta, Multiple>;
	readonly item = $derived(this.#props.item);
	#accordion = $derived(this.#props.accordion);
	#rootId = $derived(this.#props.rootId);

	/** Check if this item is disabled. */
	isDisabled = $derived(this.#accordion.disabled || this.item.disabled);
	/** Check if this item is expanded. */
	isExpanded = $derived(this.#accordion.isExpanded(this.item.id));
	/** Expands this item. */
	expand = () => this.#accordion.expand(this.item.id);
	/** Collapses this item. */
	collapse = () => this.#accordion.collapse(this.item.id);
	/** Toggles the expanded state of this item. */
	toggleExpanded = () => this.#accordion.toggleExpanded(this.item.id);

	constructor(props: AccordionItemProps<Meta, Multiple>) {
		this.#props = props;
	}

	/**
	 * Attributes for an accordion heading element.
	 */
	get heading() {
		return {
			[dataAttrs.heading]: "",
			role: "heading",
			"aria-level": this.item.headingLevel,
			"data-heading-level": this.item.headingLevel,
		};
	}

	/**
	 * Attributes for an accordion item trigger.
	 */
	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			disabled: disabledAttr(this.isDisabled),
			"aria-disabled": this.isDisabled,
			"aria-expanded": this.isExpanded,
			"data-disabled": dataAttr(this.isDisabled),
			"data-value": this.item.id,
			"data-state": this.isExpanded ? "open" : "closed",
			onclick: () => this.toggleExpanded(),
			onkeydown: (e: KeyboardEvent) => {
				const key = e.key;

				if (!([kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.HOME, kbd.END] as string[]).includes(key)) {
					return;
				}

				e.preventDefault();

				if (key === kbd.SPACE || key === kbd.ENTER) {
					if (this.isDisabled) return;
					this.toggleExpanded();
				}

				const el = e.target;
				const rootEl = document.getElementById(this.#rootId);
				if (!rootEl || !isHtmlElement(el)) return;

				const items = Array.from(rootEl.querySelectorAll(dataSelectors.trigger));

				const candidateItems = items.filter((item): item is HTMLElement => {
					if (!isHtmlElement(item)) return false;
					return !("disabled" in item.dataset);
				});

				if (!candidateItems.length) return;
				const elIdx = candidateItems.indexOf(el);

				if (e.key === kbd.ARROW_DOWN) {
					candidateItems[(elIdx + 1) % candidateItems.length]?.focus();
				}
				if (e.key === kbd.ARROW_UP) {
					candidateItems[(elIdx - 1 + candidateItems.length) % candidateItems.length]?.focus();
				}
				if (e.key === kbd.HOME) {
					candidateItems[0]?.focus();
				}
				if (e.key === kbd.END) {
					candidateItems[candidateItems.length - 1]?.focus();
				}
			},
		};
	}

	/**
	 * Attributes for an accordion content element.
	 */
	get content() {
		return {
			[dataAttrs.content]: "",
			"data-state": this.isExpanded ? "open" : "closed",
			"data-disabled": disabledAttr(this.isDisabled),
			"data-value": this.item.id,
		};
	}
}
