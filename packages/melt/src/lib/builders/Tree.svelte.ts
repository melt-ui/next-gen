/* eslint-disable @typescript-eslint/no-this-alias */
import type { MaybeGetter } from "$lib/types.js";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { last } from "$lib/utils/iterator";
import { isControlOrMeta } from "$lib/utils/platform";
import {
	MultiSelectionState,
	SingleSelectionState,
	type SelectionState,
} from "$lib/utils/selection-state.svelte";
import type { EventHandler, HTMLAttributes } from "svelte/elements";

const dataIds = createDataIds("tree", ["root", "item"]);

export type TreeItemData<TValue> = {
	id: string;
	value: TValue;
	children?: TreeItemData<TValue>[];
};

interface CommonTreeProps<TValue> {
	items: MaybeGetter<TreeItemData<TValue>[]>;
	expanded?: MaybeGetter<Iterable<string> | undefined>;
	onExpandedChange?: (value: Set<string>) => void;
}

export interface SingleSelectTreeProps<TValue> extends CommonTreeProps<TValue> {
	selected?: MaybeGetter<string | undefined>;
	onSelectedChange?: (value: string | undefined) => void;
}

export interface MultiSelectTreeProps<TValue> extends CommonTreeProps<TValue> {
	selected?: MaybeGetter<Iterable<string> | undefined>;
	onSelectedChange?: (value: Set<string>) => void;
}

export class Tree<TValue, TSelection extends SelectionState = SelectionState> {
	#context: TreeContext<TValue, TSelection>;

	constructor(context: TreeContext<TValue, TSelection>) {
		this.#context = context;
	}

	get items() {
		return this.#context.items;
	}

	get expanded() {
		return this.#context.expanded;
	}

	get selected() {
		return this.#context.selected;
	}

	last() {
		return this.#context.last();
	}
}

export class SingleSelectTree<TValue> extends Tree<TValue, SingleSelectionState> {
	constructor(props: SingleSelectTreeProps<TValue>) {
		const expanded = MultiSelectionState.create({
			value: props.expanded,
			onChange: props.onExpandedChange,
		});
		const selected = SingleSelectionState.create({
			value: props.selected,
			onChange: props.onSelectedChange,
		});
		const context = new TreeContext(props.items, expanded, selected);
		super(context);
	}
}

export class MultiSelectTree<TValue> extends Tree<TValue, MultiSelectionState> {
	constructor(props: MultiSelectTreeProps<TValue>) {
		const expanded = MultiSelectionState.create({
			value: props.expanded,
			onChange: props.onExpandedChange,
		});
		const selected = MultiSelectionState.create({
			value: props.selected,
			onChange: props.onSelectedChange,
		});
		const context = new TreeContext(props.items, expanded, selected);
		super(context);
	}
}

class TreeContext<TValue, TSelected extends SelectionState = SelectionState> {
	#items: MaybeGetter<TreeItemData<TValue>[]>;
	#expanded: MultiSelectionState;
	#selected: TSelected;

	constructor(
		items: MaybeGetter<TreeItemData<TValue>[]>,
		expanded: MultiSelectionState,
		selected: TSelected,
	) {
		this.#items = items;
		this.#expanded = expanded;
		this.#selected = selected;
	}

	#id = crypto.randomUUID();
	#tabbable: string | undefined = $state.raw();

	readonly items = $derived.by(() => {
		const items = extract(this.#items);
		return this.createTreeItems(items);
	});

	get expanded() {
		return this.#expanded;
	}

	get selected() {
		return this.#selected;
	}

	get tabbable() {
		return this.#tabbable ?? this.items[0].id;
	}

	set tabbable(value) {
		this.#tabbable = value;
	}

	createTreeItems(items: TreeItemData<TValue>[], parent?: TreeItem<TValue>): TreeItem<TValue>[] {
		return items.map((item, index) => new TreeItem(this, item, index, parent));
	}

	last() {
		return this.items.at(-1)?.last();
	}

	treeItemElementId(id: string) {
		return `${this.#id}:${id}`;
	}
}

export class TreeItem<Value> {
	#context: TreeContext<Value>;
	#item: TreeItemData<Value>;
	#index: number;
	#depth: number;
	#parent?: TreeItem<Value>;

	constructor(
		context: TreeContext<Value>,
		item: TreeItemData<Value>,
		index: number,
		parent: TreeItem<Value> | undefined,
	) {
		this.#context = context;
		this.#item = item;
		this.#index = index;
		this.#depth = parent !== undefined ? parent.depth + 1 : 0;
		this.#parent = parent;
	}

	get id() {
		return this.#item.id;
	}

	get value() {
		return this.#item.value;
	}

	get index() {
		return this.#index;
	}

	get depth() {
		return this.#depth;
	}

	get parent() {
		return this.#parent;
	}

	get siblings() {
		const { parent } = this;
		return parent !== undefined ? parent.children : this.#context.items;
	}

	get previousSibling(): TreeItem<Value> | undefined {
		return this.siblings[this.index - 1];
	}

	get nextSibling(): TreeItem<Value> | undefined {
		return this.siblings[this.index + 1];
	}

	readonly children = $derived.by(() => {
		const { children = [] } = this.#item;
		return this.#context.createTreeItems(children, this);
	});

	readonly expanded = $derived.by(() => this.#context.expanded.has(this.id));

	readonly selected = $derived.by(() => this.#context.selected.has(this.id));

	readonly attributes = $derived.by(() => {
		const context = this.#context;
		return {
			[dataIds.item]: "",
			id: context.treeItemElementId(this.id),
			role: "treeitem",
			"aria-selected": this.selected,
			"aria-expanded": this.children.length !== 0 ? this.expanded : undefined,
			"aria-level": this.depth + 1,
			"aria-posinset": this.index + 1,
			"aria-setsize": this.siblings.length,
			tabindex: context.tabbable === this.id ? 0 : -1,
			onfocusin: this.#handleFocusIn,
			onkeydown: this.#handleKeyDown,
			onclick: this.#handleClick,
		} as const satisfies HTMLAttributes<HTMLElement>;
	});

	last() {
		let current: TreeItem<Value> = this;
		while (current.expanded) {
			const last = current.children.at(-1);
			if (last === undefined) {
				break;
			}
			current = last;
		}
		return current;
	}

	previous() {
		const { previousSibling } = this;
		if (previousSibling === undefined) {
			return this.parent;
		}
		return previousSibling.last();
	}

	next() {
		if (this.expanded && this.children.length !== 0) {
			return this.children[0];
		}

		let current: TreeItem<Value> | undefined = this;
		do {
			const { nextSibling } = current;
			if (nextSibling !== undefined) {
				return nextSibling;
			}
			current = current.parent;
		} while (current !== undefined);
	}

	expand() {
		this.#context.expanded.add(this.id);
	}

	collapse() {
		this.#context.expanded.delete(this.id);
	}

	select() {
		this.#context.selected.add(this.id);
	}

	unselect() {
		this.#context.selected.delete(this.id);
	}

	element() {
		return document.getElementById(this.attributes.id);
	}

	#handleFocusIn: EventHandler<FocusEvent, HTMLElement> = (event) => {
		this.#context.tabbable = this.id;
		event.stopPropagation();
	};

	#handleKeyDown: EventHandler<KeyboardEvent, HTMLElement> = (event) => {
		if (event.currentTarget !== event.target) {
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (this.children.length === 0) {
					break;
				}

				if (!this.expanded) {
					this.expand();
				} else {
					this.children[0].element()?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (this.expanded) {
					this.collapse();
				} else {
					this.parent?.element()?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? this.next() : this.previous();
				if (next === undefined) {
					break;
				}

				const nextElement = next.element();
				if (nextElement === null) {
					break;
				}

				const context = this.#context;
				if (context.selected.type === "multiple" && event.shiftKey) {
					context.selected.addAll([this.id, next.id]);
				}

				nextElement.focus();
				break;
			}

			case "Home": {
				const context = this.#context;
				const first = context.items[0];
				if (first === this) {
					break;
				}

				const firstElement = first.element();
				if (firstElement === null) {
					break;
				}

				if (context.selected.type === "multiple" && event.shiftKey && isControlOrMeta(event)) {
					context.selected.update((ids) => selectUntilStart(ids, this));
				}

				firstElement.focus();
				break;
			}
			case "End": {
				const context = this.#context;
				const last = context.last()!;
				if (last === this) {
					break;
				}

				const lastElement = last.element();
				if (lastElement === null) {
					break;
				}

				if (context.selected.type === "multiple" && event.shiftKey && isControlOrMeta(event)) {
					context.selected.update((ids) => selectUntilEnd(ids, this));
				}

				lastElement.focus();
				break;
			}
			case " ": {
				const context = this.#context;
				if (context.selected.type === "single") {
					context.selected.current = this.id;
					break;
				}

				if (event.shiftKey) {
					context.selected.update((ids) => batchSelect(ids, context, this, event.currentTarget));
				} else {
					context.selected.toggle(this.id);
				}
				break;
			}
			case "a": {
				const context = this.#context;
				if (context.selected.type === "multiple" && isControlOrMeta(event)) {
					context.selected.update((ids) => selectAll(ids, context.items));
				}
				break;
			}
			case "Escape": {
				this.#context.selected.clear();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	};

	#handleClick: EventHandler<MouseEvent, HTMLElement> = (event) => {
		const context = this.#context;
		const isMultiSelect = context.selected.type === "multiple";

		if (isMultiSelect && isControlOrMeta(event)) {
			context.selected.toggle(this.id);
		} else if (isMultiSelect && event.shiftKey) {
			context.selected.update((ids) => batchSelect(ids, context, this, event.currentTarget));
		} else {
			context.selected.set(this.id);
		}

		event.stopPropagation();
	};
}

function selectAll<TValue>(ids: Set<string>, items: TreeItem<TValue>[]) {
	for (const item of items) {
		ids.add(item.id);

		if (item.expanded) {
			selectAll(ids, item.children);
		}
	}
}

function selectUntilStart<TValue>(ids: Set<string>, from: TreeItem<TValue>) {
	let current: TreeItem<TValue> | undefined = from;
	do {
		ids.add(current.id);
		current = current.previous();
	} while (current !== undefined);
}

function selectUntilEnd<TValue>(ids: Set<string>, from: TreeItem<TValue>) {
	let current: TreeItem<TValue> | undefined = from;
	do {
		ids.add(current.id);
		current = current.next();
	} while (current !== undefined);
}

function batchSelect<TValue>(
	ids: Set<string>,
	context: TreeContext<TValue>,
	target: TreeItem<TValue>,
	targetElement: HTMLElement,
) {
	// Select all items from the last selected item up to the target.
	const lastSelected = last(ids);
	if (lastSelected === undefined) {
		// Select all items from the start up to the target.
		let current: TreeItem<TValue> | undefined = context.items[0];
		do {
			ids.add(current.id);
			current = current.next();
		} while (current !== undefined && current.id !== target.id);
		return;
	}

	const lastSelectedElement = document.getElementById(context.treeItemElementId(lastSelected));
	if (lastSelectedElement === null) {
		return;
	}

	const preceding =
		targetElement.compareDocumentPosition(lastSelectedElement) & Node.DOCUMENT_POSITION_PRECEDING;

	const items: TreeItem<TValue>[] = [];
	let current: TreeItem<TValue> | undefined = target;
	while (current !== undefined && current.id !== lastSelected) {
		items.push(current);
		current = preceding ? current.previous() : current.next();
	}

	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i];
		ids.add(item.id);
	}
}
