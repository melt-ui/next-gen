import { SyncedSet } from "$lib/SyncedSet.svelte.js";
import type { MaybeGetter } from "$lib/types.js";
import { extract } from "$lib/utils/extract.svelte.js";
import { createDataIds } from "$lib/utils/identifiers.svelte.js";
import { last } from "$lib/utils/iterator.js";
import { isControlOrMeta } from "$lib/utils/platform.js";
import { toggle } from "$lib/utils/set.js";
import { nanoid } from "nanoid/non-secure";
import type { HTMLAttributes } from "svelte/elements";
import { SvelteSet } from "svelte/reactivity";

const dataIds = createDataIds("tree-view", ["tree", "item"]);

/**
 * A tree's item.
 * It may have children, in which case it'll be expandable.
 */
export type TreeData<Value> = Array<{
	id: string;
	value: Value;
	children?: TreeData<Value>;
}>;

/**
 * Defines if an user can select one or multiple items in the tree.
 */
export type TreeSelectionMode = "single" | "multiple";

export type TreeProps<Value> = {
	/**
	 * The data to be rendered in the tree.
	 */
	data: MaybeGetter<TreeData<Value>>;

	/**
	 * The selection mode of the tree.
	 *
	 * @default "single"
	 */
	selectionMode?: MaybeGetter<TreeSelectionMode | undefined>;

	/**
	 * An array of ids of the selected items.
	 *
	 * @default []
	 */
	selected?: MaybeGetter<Iterable<string>> | SvelteSet<string>;
	/**
	 * Called when the `Tree` instance tries to change the selected items.
	 */
	onSelectedChange?: (selected: SvelteSet<string>) => void;

	/**
	 * An array of ids of the expanded items.
	 */
	expanded?: MaybeGetter<Iterable<string>> | SvelteSet<string>;
	/**
	 * Called when the `Tree` instance tries to change the expanded items.
	 */
	onExpandedChange?: (expanded: SvelteSet<string>) => void;
};

export class Tree<Value> {
	#state: TreeState<Value>;

	constructor(props: TreeProps<Value>) {
		this.#state = new TreeState(props);
	}

	get roots(): ReadonlyArray<TreeItem<Value>> {
		return this.#state.roots;
	}

	get selectionMode(): TreeSelectionMode {
		return this.#state.selectionMode;
	}

	get selected(): SvelteSet<string> {
		return this.#state.selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#state.expanded;
	}

	last(): TreeItem<Value> | undefined {
		return this.#state.last();
	}

	treeItemElementId(id: string): string {
		return this.#state.treeItemElementId(id);
	}

	treeItemElement(id: string): HTMLElement | null {
		return this.#state.treeItemElement(id);
	}

	props() {
		return {
			[dataIds.tree]: "",
			role: "tree",
			"aria-multiselectable": this.selectionMode === "multiple",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}

class TreeState<Value> {
	#data: MaybeGetter<TreeData<Value>>;
	#selectionMode: MaybeGetter<TreeSelectionMode | undefined>;
	#selected: SyncedSet<string>;
	#expanded: SyncedSet<string>;

	#id = nanoid();
	#tabbable: string | undefined = $state.raw();

	constructor(props: TreeProps<Value>) {
		this.#data = props.data;
		this.#selectionMode = props.selectionMode;
		this.#selected = new SyncedSet({
			value: props.selected,
			onChange: props.onSelectedChange,
		});
		this.#expanded = new SyncedSet({
			value: props.expanded,
			onChange: props.onExpandedChange,
		});
	}

	readonly roots: ReadonlyArray<TreeItem<Value>> = $derived.by(() => {
		const data = extract(this.#data);
		return this.createTreeItems(data);
	});

	readonly selectionMode: TreeSelectionMode = $derived.by(() =>
		extract(this.#selectionMode, "single"),
	);

	get selected() {
		return this.#selected;
	}

	get expanded() {
		return this.#expanded;
	}

	get tabbable(): string | undefined {
		return this.#tabbable ?? this.roots[0]?.id;
	}

	set tabbable(value: string) {
		this.#tabbable = value;
	}

	createTreeItems(data: TreeData<Value>, parent?: TreeItem<Value>): Array<TreeItem<Value>> {
		return data.map((item, index) => {
			const { id, value, children = [] } = item;
			return new TreeItem(this, id, value, index, parent, children);
		});
	}

	last(): TreeItem<Value> | undefined {
		let last = this.roots.at(-1);
		if (last === undefined) {
			return;
		}

		while (last.expanded && last.children.length !== 0) {
			last = last.children.at(-1)!;
		}
		return last;
	}

	treeItemElementId(id: string): string {
		return `${this.#id}:${id}`;
	}

	treeItemElement(id: string): HTMLElement | null {
		const elementId = this.treeItemElementId(id);
		return document.getElementById(elementId);
	}

	selectSubtree(item: TreeItem<Value>): void {
		this.selected.add(item.id);

		if (item.expanded) {
			for (const child of item.children) {
				this.selectSubtree(child);
			}
		}
	}

	selectAll(): void {
		for (const root of this.roots) {
			this.selectSubtree(root);
		}
	}

	selectUntilFirst(start: TreeItem<Value>): void {
		let current = start;
		while (true) {
			this.selected.add(current.id);

			const { siblings } = current;
			for (let i = current.index - 1; i >= 0; i--) {
				const sibling = siblings[i];
				this.selectSubtree(sibling);
			}

			if (current.parent === undefined) {
				return;
			}

			current = current.parent;
		}
	}

	selectUntilLast(start: TreeItem<Value>): void {
		let current = start;
		while (true) {
			const { siblings } = current;
			for (let i = current.index; i < siblings.length; i++) {
				const sibling = siblings[i];
				this.selectSubtree(sibling);
			}

			while (true) {
				if (current.parent === undefined) {
					return;
				}

				current = current.parent;

				if (current.nextSibling !== undefined) {
					current = current.nextSibling;
					break;
				}
			}
		}
	}

	selectFromFirstUntil(
		target: TreeItem<Value>,
		items: ReadonlyArray<TreeItem<Value>> = this.roots,
	): boolean {
		for (const item of items) {
			this.selected.add(item.id);

			if (item === target) {
				return true;
			}

			if (item.expanded) {
				const found = this.selectFromFirstUntil(target, item.children);
				if (found) {
					return true;
				}
			}
		}
		return false;
	}

	batchSelectUntil(target: TreeItem<Value>, targetElement: HTMLElement): void {
		const lastSelected = last(this.selected);
		if (lastSelected === undefined) {
			this.selectFromFirstUntil(target);
			return;
		}

		const lastSelectedElement = this.treeItemElement(lastSelected);
		if (lastSelectedElement === null) {
			this.selectFromFirstUntil(target);
			return;
		}

		const targetRect = targetElement.getBoundingClientRect();
		const lastSelectedRect = lastSelectedElement.getBoundingClientRect();
		const down = lastSelectedRect.top > targetRect.top;
		const items: Array<TreeItem<Value>> = [];

		let current = target;
		while (true) {
			items.push(current);

			if (current.id === lastSelected) {
				break;
			}

			const next = down ? current.next() : current.previous();
			if (next === undefined) {
				break;
			}

			current = next;
		}

		for (let i = items.length - 1; i >= 0; i--) {
			const item = items[i];
			this.selected.add(item.id);
		}
	}

	setSelectedItem(item: TreeItem<Value>): void {
		this.selected.clear();
		this.selected.add(item.id);
	}
}

export class TreeItem<Value> {
	#state: TreeState<Value>;
	#id: string;
	#value: Value;
	#index: number;
	#level: number;
	#parent: TreeItem<Value> | undefined;
	#children: TreeData<Value>;

	constructor(
		state: TreeState<Value>,
		id: string,
		value: Value,
		index: number,
		parent: TreeItem<Value> | undefined,
		children: TreeData<Value>,
	) {
		this.#state = state;
		this.#id = id;
		this.#value = value;
		this.#index = index;
		this.#level = parent !== undefined ? parent.level + 1 : 1;
		this.#parent = parent;
		this.#children = children;
	}

	get id(): string {
		return this.#id;
	}

	get value(): Value {
		return this.#value;
	}

	get index(): number {
		return this.#index;
	}

	get level(): number {
		return this.#level;
	}

	get parent(): TreeItem<Value> | undefined {
		return this.#parent;
	}

	readonly children: ReadonlyArray<TreeItem<Value>> = $derived.by(() =>
		this.#state.createTreeItems(this.#children, this),
	);

	readonly siblings: ReadonlyArray<TreeItem<Value>> = $derived.by(
		() => this.parent?.children ?? this.#state.roots,
	);

	readonly previousSibling: TreeItem<Value> | undefined = $derived.by(
		() => this.siblings[this.index - 1],
	);

	readonly nextSibling: TreeItem<Value> | undefined = $derived.by(
		() => this.siblings[this.index + 1],
	);

	readonly selected: boolean = $derived.by(() => this.#state.selected.has(this.id));

	readonly expanded: boolean = $derived.by(() => this.#state.expanded.has(this.id));

	previous(): TreeItem<Value> | undefined {
		if (this.previousSibling === undefined) {
			return this.parent;
		}

		let current = this.previousSibling;
		while (current.expanded && current.children.length !== 0) {
			current = current.children.at(-1)!;
		}
		return current;
	}

	next(): TreeItem<Value> | undefined {
		if (this.expanded && this.children.length !== 0) {
			return this.children[0];
		}

		let current: TreeItem<Value> = this;
		while (true) {
			if (current.nextSibling !== undefined) {
				return current.nextSibling;
			}

			if (current.parent === undefined) {
				return;
			}

			current = current.parent;
		}
	}

	element(): HTMLElement | null {
		return this.#state.treeItemElement(this.id);
	}

	props() {
		return {
			[dataIds.item]: "",
			id: this.#state.treeItemElementId(this.id),
			role: "treeitem",
			"aria-selected": this.selected,
			"aria-expanded": this.children.length !== 0 ? this.expanded : undefined,
			"aria-level": this.level,
			"aria-posinset": this.index + 1,
			"aria-setsize": this.siblings.length,
			tabindex: this.#state.tabbable === this.id ? 0 : -1,
			onkeydown: (event) => {
				if (event.currentTarget !== event.target) {
					return;
				}

				switch (event.key) {
					case "ArrowRight": {
						if (this.children.length === 0) {
							break;
						}

						if (!this.expanded) {
							this.#state.expanded.add(this.id);
						} else {
							this.children[0].element()?.focus();
						}
						break;
					}
					case "ArrowLeft": {
						if (this.expanded) {
							this.#state.expanded.delete(this.id);
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

						nextElement.focus();

						if (this.#state.selectionMode === "multiple" && event.shiftKey) {
							this.#state.selected.add(this.id).add(next.id);
						}
						break;
					}
					case "Home": {
						const first = this.#state.roots[0];
						if (this === first || first === undefined) {
							break;
						}

						const firstElement = first.element();
						if (firstElement === null) {
							break;
						}

						firstElement.focus();

						if (
							this.#state.selectionMode === "multiple" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							this.#state.selectUntilFirst(this);
						}
						break;
					}
					case "End": {
						const last = this.#state.last();
						if (this === last || last === undefined) {
							break;
						}

						const lastElement = last.element();
						if (lastElement === null) {
							break;
						}

						lastElement.focus();

						if (
							this.#state.selectionMode === "multiple" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							this.#state.selectUntilLast(this);
						}
						break;
					}
					case " ": {
						if (this.#state.selectionMode === "single") {
							this.#state.setSelectedItem(this);
							break;
						}

						if (event.shiftKey) {
							this.#state.batchSelectUntil(this, event.currentTarget);
						} else {
							toggle(this.#state.selected, this.id);
						}
						break;
					}
					case "a": {
						if (this.#state.selectionMode === "multiple" && isControlOrMeta(event)) {
							this.#state.selectAll();
						}
						break;
					}
					case "Escape": {
						this.#state.selected.clear();
						break;
					}
					default: {
						return;
					}
				}

				event.preventDefault();
				event.stopPropagation();
			},
			onclick: (event) => {
				const { selectionMode } = this.#state;
				if (selectionMode === "multiple" && isControlOrMeta(event)) {
					toggle(this.#state.selected, this.id);
				} else if (selectionMode === "multiple" && event.shiftKey) {
					this.#state.batchSelectUntil(this, event.currentTarget);
				} else {
					this.#state.setSelectedItem(this);
				}

				event.stopPropagation();
			},
			onfocusin: (event) => {
				this.#state.tabbable = this.id;
				event.stopPropagation();
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	select(): void {
		if (this.#state.selectionMode === "multiple") {
			this.#state.selected.add(this.id);
		} else {
			this.#state.setSelectedItem(this);
		}
	}

	unselect(): void {
		this.#state.selected.delete(this.id);
	}

	expand(): void {
		this.#state.expanded.add(this.id);
	}

	collapse(): void {
		this.#state.expanded.delete(this.id);
	}
}
