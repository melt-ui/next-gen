import type { Extracted, MaybeGetter } from "$lib/types";
import { AltSelectionState, type MaybeMultiple } from "$lib/utils/alt-selection-state.svelte";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { isString } from "$lib/utils/is";
import { first, last } from "$lib/utils/iterator";
import { isControlOrMeta } from "$lib/utils/platform";
import type { FalseIfUndefined } from "$lib/utils/types";
import { useDebounce } from "runed";

const identifiers = createDataIds("tree", ["root", "item", "group"]);
const letterRegex = /^[a-zA-Z]$/;

/**
 * Represents a tree item with optional metadata and children
 * @template Meta - Type of additional metadata properties for the tree item
 */
export type AltTreeItem<Meta extends Record<string, unknown> = Record<never, never>> = {
	/** Unique identifier for the tree item */
	id: string;
	/** Optional array of child tree items */
	children?: AltTreeItem<Meta>[];
} & Meta;

/**
 * Props for configuring the AltTree component
 * @template Items - Array type extending AltTreeItem
 * @template Multiple - Boolean indicating if multiple selection is enabled
 */
type AltTreeProps<Items extends AltTreeItem[], Multiple extends boolean = false> = {
	/**
	 * If `true`, the user can select multiple items.
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;
	/**
	 * The currently selected item(s).
	 * If `multiple` is `true`, this should be an `Iterable`.
	 * Otherwise, it'll be a `string`.
	 * @default undefined
	 */
	selected?: MaybeMultiple<Multiple>;
	/**
	 * Callback fired when selection changes
	 * @param value - For multiple selection, a Set of selected IDs. For single selection, a single ID or undefined
	 */
	onSelectedChange?: (value: Multiple extends true ? Set<string> : string | undefined) => void;
	/**
	 * The currently expanded items
	 */
	expanded?: MaybeMultiple<true>;
	/**
	 * Callback fired when expanded state changes
	 * @param value - Set of expanded item IDs
	 */
	onExpandedChange?: (value: Set<string>) => void;
	/**
	 * If `true`, groups (items with children) expand on click.
	 * @default true
	 */
	expandOnClick?: MaybeGetter<boolean | undefined>;
	/**
	 * The items contained in the tree.
	 * @required
	 */
	items: Items;
};

type Selected<Multiple extends boolean | undefined> = AltSelectionState<FalseIfUndefined<Multiple>>;
type Items<I extends AltTreeItem[]> = Extracted<AltTreeProps<I>["items"]>;
type Item<I extends AltTreeItem[]> = Items<I>[number];

/**
 * Main tree component class that handles selection, expansion, and keyboard navigation
 * @template I - Array type extending AltTreeItem
 * @template Multiple - Boolean indicating if multiple selection is enabled
 */
export class AltTree<I extends AltTreeItem[], Multiple extends boolean = false> {
	#props!: AltTreeProps<I, Multiple>;

	/** The items contained in the tree */
	readonly items = $derived(extract(this.#props.items)) as Items<I>;
	/** If `true`, the user can select multiple items holding `Control`/`Meta` or `Shift` */
	readonly multiple = $derived(extract(this.#props.multiple, false as Multiple)) as Multiple;
	/** If `true`, groups (items with children) expand on click */
	readonly expandOnClick = $derived(extract(this.#props.expandOnClick, true));

	#selected: Selected<Multiple>;
	#expanded: AltSelectionState<true>;

	#id = crypto.randomUUID();

	#typeaheadString = $state("");
	#clearTypeahead = useDebounce(() => {
		this.#typeaheadString = "";
	}, 250);

	/**
	 * Creates a new AltTree instance
	 * @param props - Configuration props for the tree
	 */
	constructor(props: AltTreeProps<I, Multiple>) {
		this.#props = props;
		this.#selected = new AltSelectionState({
			value: props.selected,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onChange: props.onSelectedChange as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			multiple: props.multiple as any,
		}) as Selected<Multiple>;
		this.#expanded = new AltSelectionState({
			value: props.expanded,
			onChange: props.onExpandedChange,
			multiple: true,
		});
	}

	/**
	 * Currently selected item(s)
	 * For multiple selection, returns a Set of IDs
	 * For single selection, returns a single ID or undefined
	 */
	get selected() {
		return this.#selected.current as Multiple extends true ? Set<string> : string | undefined;
	}

	set selected(v) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.#selected.current = v as any;
	}

	/**
	 * Set of currently expanded item IDs
	 */
	get expanded() {
		return this.#expanded.current;
	}

	set expanded(v) {
		this.#expanded.current = v;
	}

	/**
	 * Checks if an item is currently selected
	 * @param id - ID of the item to check
	 */
	isSelected(id: string) {
		return this.#selected.has(id);
	}

	/**
	 * Checks if an item is currently expanded
	 * @param id - ID of the item to check
	 */
	isExpanded(id: string) {
		return this.#expanded.has(id);
	}

	/**
	 * Expands a specific item
	 * @param id - ID of the item to expand
	 */
	expand(id: string) {
		this.#expanded.add(id);
	}

	/**
	 * Collapses a specific item
	 * @param id - ID of the item to collapse
	 */
	collapse(id: string) {
		this.#expanded.delete(id);
	}

	/**
	 * Toggles the expanded state of an item
	 * @param id - ID of the item to toggle
	 */
	toggleExpand(id: string) {
		this.#expanded.toggle(id);
	}

	/**
	 * Selects a specific item
	 * @param id - ID of the item to select
	 */
	select(id: string) {
		this.#selected.add(id);
	}

	/**
	 * Deselects a specific item
	 * @param id - ID of the item to deselect
	 */
	deselect(id: string) {
		this.#selected.delete(id);
	}

	/**
	 * Clears all current selections
	 */
	clearSelection() {
		this.#selected.clear();
	}

	/**
	 * Toggles the selected state of an item
	 * @param id - ID of the item to toggle
	 */
	toggleSelect(id: string) {
		this.#selected.toggle(id);
	}

	/**
	 * Selects all visible items.
	 * If all items are already selected, clears the selection.
	 */
	selectAll() {
		const ids = getAllChildren(this, true).map((c) => c.id);
		const alreadySelected = ids.every((id) => this.#selected.has(id));
		if (alreadySelected) {
			this.clearSelection();
		} else {
			this.#selected.addAll(ids);
		}
	}

	/**
	 * Gets the DOM ID for a specific tree item
	 * @param id - ID of the item
	 */
	getItemId(id: string): string {
		return `melt-tree-${this.#id}-item--${id}`;
	}

	/**
	 * Gets the DOM element for a specific tree item
	 * @param id - ID of the item
	 */
	getItemEl(id: string): HTMLElement | null {
		return document.getElementById(this.getItemId(id));
	}

	/**
	 * Selects all items between the last selected item and the specified item
	 * @param id - ID of the item to select until
	 */
	selectUntil(id: string): void {
		// TODO: Use a direction constant to ensure correct order?
		if (!this.#selected.size()) return this.select(id);

		const allChildren = getAllChildren(this);

		const to = allChildren.find((c) => c.id === id);
		if (!to) return;

		const from = allChildren.find((c) => c.id === first(this.#selected.toSet()));
		if (!from) return this.select(id);

		const fromIdx = allChildren.indexOf(from);
		const toIdx = allChildren.indexOf(to);

		const [start, end] = fromIdx < toIdx ? [from, to] : [to, from];

		let current = start;
		this.clearSelection();
		// Ensure from remains the same
		this.select(from.id);
		this.select(start.id);
		while (current.id !== end.id && current.next) {
			current = current.next;
			this.select(current.id);
		}
	}

	typeahead(letter: string) {
		if (!letterRegex.test(letter)) return;
		this.#typeaheadString += letter;
		this.#clearTypeahead();

		const activeEl = document.activeElement;
		if (!isString(activeEl?.getAttribute(identifiers.item))) return;
		const visibleChildren = getAllChildren(this, true);

		const index = visibleChildren.findIndex((c) => c.elId === activeEl.id);
		const elementsForTypeahead = visibleChildren
			.filter((c) => c.id.startsWith(this.#typeaheadString))
			.map((c) => ({ c, index: visibleChildren.indexOf(c) }));
		if (!elementsForTypeahead.length) return;
		// Get element with higher index than index. If no such element exists, get the first one
		const nextEl = elementsForTypeahead.find((e) => e.index > index) ?? elementsForTypeahead[0];

		nextEl.c.focus();
	}

	/**
	 * Gets ARIA attributes for the root tree element
	 */
	get root() {
		return {
			role: "tree",
			[identifiers.root]: "",
		};
	}

	/**
	 * ARIA attributes for group elements
	 */
	get group() {
		return {
			role: "group",
			[identifiers.group]: "",
		};
	}

	/**
	 * Array of Child instances representing the top-level items
	 */
	get children() {
		return this.items.map(
			(i) => new Child({ tree: this, item: i, parent: this, selectedState: this.#selected }),
		);
	}
}

/**
 * Helper function to get all child items in a tree or subtree
 * @param treeOrChild - Tree or Child instance to get children from
 * @param onlyVisible - If true, only returns visible (expanded) children
 */
function getAllChildren<I extends AltTreeItem[]>(
	treeOrChild: AltTree<I, boolean> | Child<I>,
	onlyVisible = false,
): Child<I>[] {
	const children =
		!onlyVisible || treeOrChild instanceof AltTree || treeOrChild.expanded
			? treeOrChild.children
			: [];

	return (
		children?.reduce((acc, c) => {
			return [...acc, c, ...getAllChildren(c, onlyVisible)];
		}, [] as Child<I>[]) || []
	);
}

type ChildProps<I extends AltTreeItem[]> = {
	tree: AltTree<I, boolean>;
	selectedState: AltSelectionState<boolean>;
	item: Item<I>;
	parent?: Child<I> | AltTree<I, boolean>;
};

/**
 * Class representing a single item in the tree
 * @template I - Array type extending AltTreeItem
 */
class Child<I extends AltTreeItem[]> {
	#props!: ChildProps<I>;
	tree = $derived(this.#props.tree);
	selectedState = $derived(this.#props.selectedState);
	item = $derived(this.#props.item);
	elId = $derived(this.tree.getItemId(this.item.id));
	id = $derived(this.item.id);
	parent = $derived(this.#props.parent);

	/**
	 * Creates a new Child instance
	 * @param props - Configuration props for the child
	 */
	constructor(props: ChildProps<I>) {
		this.#props = props;
	}

	/** The DOM element representing this item */
	get el() {
		return document.getElementById(this.elId);
	}

	/** Whether this item is currently selected */
	readonly selected = $derived(this.tree.isSelected(this.id));
	/** Whether this item is currently expanded */
	readonly expanded = $derived(this.tree.isExpanded(this.id));
	/** Whether this item can be expanded (has children) */
	readonly canExpand = $derived(Boolean(this.item.children && this.item.children?.length > 0));
	/** Collapses this item */
	collapse = () => this.tree.collapse(this.id);
	/** Expands this item */
	expand = () => this.tree.expand(this.id);
	/** Toggles the expanded state of this item */
	toggleExpand = () => this.tree.toggleExpand(this.id);
	/** Selects this item */
	select = () => this.tree.select(this.id);
	/** Deselects this item */
	deselect = () => this.tree.deselect(this.id);
	/** Toggles the selected state of this item */
	toggleSelect = () => this.tree.toggleSelect(this.id);
	/** Focuses this item's DOM element */
	focus = () => this.el?.focus();
	idx = $derived(this.parent?.children?.findIndex((c) => c.id === this.id) ?? -1);

	/** Gets the previous sibling item */
	get previousSibling() {
		return this.parent?.children?.[this.idx - 1];
	}

	/** Gets the next sibling item */
	get nextSibling() {
		return this.parent?.children?.[this.idx + 1];
	}

	/** Gets the previous item in the tree (including parent/child relationships) */
	get previous(): Child<I> | undefined {
		let current = this.previousSibling;
		if (!current) return this.parent instanceof Child ? this.parent : undefined;
		while (current?.expanded) {
			current = last(current?.children ?? []);
		}
		return current;
	}

	/** Gets the next item in the tree (including parent/child relationships) */
	get next(): Child<I> | undefined {
		if (this.expanded) {
			return this.children?.[0];
		}
		if (this.nextSibling) {
			return this.nextSibling;
		}
		if (this.parent instanceof Child) {
			return this.parent.nextSibling;
		}
	}

	/** Gets the tabindex for this item's DOM element */
	get tabindex() {
		if (this.selectedState.size()) {
			return this.tree.isSelected(this.id) ? 0 : -1;
		}
		return this.parent instanceof AltTree && this.idx === 0 ? 0 : -1;
	}

	/** Gets DOM and ARIA attributes for this item */
	get attrs() {
		return {
			id: this.elId,
			[identifiers.item]: "",
			"data-selected": dataAttr(this.selected),
			tabindex: this.tabindex,
			role: "treeitem",
			onclick: (e: MouseEvent) => {
				e.stopPropagation();
				if (!isControlOrMeta(e) && !e.shiftKey) this.tree.clearSelection();
				if (
					this.tree.expandOnClick &&
					this.canExpand &&
					(!this.tree.multiple || (!isControlOrMeta(e) && !e.shiftKey))
				) {
					this.toggleExpand();
				}
				if (isControlOrMeta(e)) this.toggleSelect();
				else this.tree.select(this.id);
				if (e.shiftKey) this.tree.selectUntil(this.id);
				this.focus();
			},
			onkeydown: (e: KeyboardEvent) => {
				let shouldPrevent = true;
				switch (e.key) {
					case "ArrowLeft": {
						if (this.expanded) {
							this.collapse();
							break;
						}

						if (!(this.parent instanceof Child)) return;
						this.parent?.focus();

						break;
					}
					case "ArrowRight": {
						if (!this.canExpand) break;
						if (this.expanded) {
							this.children?.[0]?.focus();
							break;
						}
						this.expand();
						break;
					}
					case "ArrowUp": {
						this.previous?.focus();
						if (e.shiftKey) this.previous?.toggleSelect();
						break;
					}
					case "ArrowDown": {
						this.next?.focus();
						if (e.shiftKey) this.next?.toggleSelect();
						break;
					}
					case " ": {
						if (!this.tree.multiple) break;
						if (e.shiftKey) {
							this.tree.selectUntil(this.id);
							break;
						}
						this.toggleSelect();
						break;
					}
					case "Enter": {
						this.tree.clearSelection();
						this.select();

						break;
					}
					case "Home": {
						first(getAllChildren(this.tree))?.focus();
						break;
					}

					case "End": {
						last(getAllChildren(this.tree, true))?.focus();
						break;
					}
					default: {
						if (letterRegex.test(e.key)) {
							if (e.ctrlKey) {
								console.log(e.key);
								if (e.key === "a") {
									this.tree.selectAll();
								}
								break;
							}
							this.tree.typeahead(e.key);
							break;
						}
						shouldPrevent = false;
					}
				}

				if (shouldPrevent) {
					e.preventDefault();
					e.stopPropagation();
				}
			},
		};
	}

	/** The item's sub-items, if any */
	get children() {
		return this.item.children?.map((i) => new Child({ ...this.#props, item: i, parent: this }));
	}
}
