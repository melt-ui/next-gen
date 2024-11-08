import type { MaybeGetter } from "$lib/types.js";
import { extract } from "$lib/utils/extract.svelte.js";
import { createDataIds } from "$lib/utils/identifiers.svelte.js";
import { isControlOrMeta } from "$lib/utils/platform.js";
import { nanoid } from "nanoid/non-secure";
import { SvelteSet } from "svelte/reactivity";

const dataIds = createDataIds("tree-view", ["tree", "item"]);

export type TreeData<Value> = Array<{
	id: string;
	value: Value;
	children?: TreeData<Value>;
}>;

export type TreeSelectionBehavior = "replace" | "toggle";

export type TreeProps<Value> = {
	data: MaybeGetter<TreeData<Value>>;
	selectionBehavior?: MaybeGetter<TreeSelectionBehavior | undefined>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	defaultExpanded?: Iterable<string>;
};

export class Tree<Value> {
	#data: MaybeGetter<TreeData<Value>>;
	#selectionBehavior: MaybeGetter<TreeSelectionBehavior | undefined>;
	#selected: SvelteSet<string>;
	#expanded: SvelteSet<string>;

	#id = nanoid();
	#tabbable: string | undefined = $state.raw();

	constructor(props: TreeProps<Value>) {
		this.#data = props.data;
		this.#selectionBehavior = props.selectionBehavior;
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
	}

	readonly roots: ReadonlyArray<TreeItem<Value>> = $derived.by(() => {
		const data = extract(this.#data);
		return createTreeItems(this, data);
	});

	readonly selectionBehavior: TreeSelectionBehavior = $derived.by(() =>
		extract(this.#selectionBehavior, "replace"),
	);

	get selected(): SvelteSet<string> {
		return this.#selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#expanded;
	}

	readonly tabbable: string | undefined = $derived.by(() => this.#tabbable ?? this.roots[0]?.id);

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

	props() {
		return {
			[dataIds.tree]: "",
			role: "tree",
			"aria-multiselectable": this.selectionBehavior === "toggle",
		} as const;
	}

	treeItemElementId(item: TreeItem<Value>): string {
		return `${this.#id}:${item.id}`;
	}

	onFocusTreeItem(item: TreeItem<Value>): void {
		this.#tabbable = item.id;
	}
}

export class TreeItem<Value> {
	#tree: Tree<Value>;
	#id: string;
	#value: Value;
	#index: number;
	#level: number;
	#parent: TreeItem<Value> | undefined;
	#children: TreeData<Value>;

	constructor(
		tree: Tree<Value>,
		id: string,
		value: Value,
		index: number,
		parent: TreeItem<Value> | undefined,
		children: TreeData<Value>,
	) {
		this.#tree = tree;
		this.#id = id;
		this.#value = value;
		this.#index = index;
		this.#level = parent !== undefined ? parent.level + 1 : 1;
		this.#parent = parent;
		this.#children = children;
	}

	get tree(): Tree<Value> {
		return this.#tree;
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
		createTreeItems(this.tree, this.#children, this),
	);

	readonly siblings: ReadonlyArray<TreeItem<Value>> = $derived.by(
		() => this.parent?.children ?? this.tree.roots,
	);

	readonly previousSibling: TreeItem<Value> | undefined = $derived.by(
		() => this.siblings[this.index - 1],
	);

	readonly nextSibling: TreeItem<Value> | undefined = $derived.by(
		() => this.siblings[this.index + 1],
	);

	readonly selected: boolean = $derived.by(() => this.tree.selected.has(this.id));

	readonly expanded: boolean = $derived.by(() => this.tree.expanded.has(this.id));

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
		const elementId = this.tree.treeItemElementId(this);
		return document.getElementById(elementId);
	}

	props() {
		return {
			[dataIds.item]: "",
			id: this.tree.treeItemElementId(this),
			role: "treeitem",
			"aria-selected": this.selected,
			"aria-expanded": this.children.length !== 0 ? this.expanded : undefined,
			"aria-level": this.level,
			"aria-posinset": this.index + 1,
			"aria-setsize": this.siblings.length,
			tabindex: this.tree.tabbable === this.id ? 0 : -1,
			onkeydown: (event: KeyboardEvent) => {
				if (event.currentTarget !== event.target) {
					return;
				}

				switch (event.key) {
					case "ArrowRight": {
						if (this.children.length === 0) {
							break;
						}

						if (!this.expanded) {
							this.tree.expanded.add(this.id);
						} else {
							this.children[0].element()?.focus();
						}
						break;
					}
					case "ArrowLeft": {
						if (this.expanded) {
							this.tree.expanded.delete(this.id);
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

						next.element()?.focus();

						if (this.tree.selectionBehavior === "toggle" && event.shiftKey) {
							this.tree.selected.add(this.id).add(next.id);
						}
						break;
					}
					case "Home": {
						const first = this.tree.roots[0];
						if (this === first || first === undefined) {
							break;
						}

						first.element()?.focus();

						if (
							this.tree.selectionBehavior === "toggle" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							selectFromStartUntil(this);
						}
						break;
					}
					case "End": {
						let last = this.tree.last();
						if (this === last || last === undefined) {
							break;
						}

						last.element()?.focus();

						if (
							this.tree.selectionBehavior === "toggle" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							selectFromEndUntil(this);
						}
						break;
					}
					case " ": {
						const { selectionBehavior, selected } = this.tree;
						if (selectionBehavior === "toggle") {
							toggle(selected, this.id);
						} else {
							selected.clear();
							selected.add(this.id);
						}
						break;
					}
					case "a": {
						if (this.tree.selectionBehavior === "toggle" && isControlOrMeta(event)) {
							selectAll(this.tree);
						}
						break;
					}
					case "Escape": {
						this.tree.selected.clear();
						break;
					}
					default: {
						return;
					}
				}

				event.preventDefault();
				event.stopPropagation();
			},
			onclick: (event: MouseEvent) => {
				const { selectionBehavior, selected } = this.tree;
				if (selectionBehavior === "toggle" && isControlOrMeta(event)) {
					toggle(selected, this.id);
				} else {
					selected.clear();
					selected.add(this.id);
				}

				event.stopPropagation();
			},
			onfocusin: (event: FocusEvent) => {
				this.tree.onFocusTreeItem(this);
				event.stopPropagation();
			},
		} as const;
	}

	select(): void {
		const { selectionBehavior, selected } = this.tree;
		if (selectionBehavior === "replace") {
			selected.clear();
		}
		selected.add(this.id);
	}

	unselect(): void {
		this.tree.selected.delete(this.id);
	}

	expand(): void {
		this.tree.expanded.add(this.id);
	}

	collapse(): void {
		this.tree.expanded.delete(this.id);
	}
}

function toggle(ids: Set<string>, id: string): void {
	const deleted = ids.delete(id);
	if (!deleted) {
		ids.add(id);
	}
}

function createTreeItems<Value>(
	tree: Tree<Value>,
	data: TreeData<Value>,
	parent?: TreeItem<Value>,
): TreeItem<Value>[] {
	return data.map((item, index) => {
		const { id, value, children = [] } = item;
		return new TreeItem(tree, id, value, index, parent, children);
	});
}

function selectAll<Value>(
	tree: Tree<Value>,
	nodes: ReadonlyArray<TreeItem<Value>> = tree.roots,
): void {
	for (const node of nodes) {
		tree.selected.add(node.id);

		if (node.expanded) {
			selectAll(tree, node.children);
		}
	}
}

function selectFromStartUntil<Value>(
	target: TreeItem<Value>,
	nodes: ReadonlyArray<TreeItem<Value>> = target.tree.roots,
): boolean {
	for (const node of nodes) {
		node.tree.selected.add(node.id);

		if (node === target) {
			return true;
		}

		if (node.expanded) {
			const found = selectFromStartUntil(target, node.children);
			if (found) {
				return true;
			}
		}
	}
	return false;
}

function selectFromEndUntil<Value>(
	target: TreeItem<Value>,
	nodes: ReadonlyArray<TreeItem<Value>> = target.tree.roots,
): boolean {
	for (let i = nodes.length - 1; i >= 0; i--) {
		const node = nodes[i];

		if (node.expanded) {
			const found = selectFromEndUntil(target, node.children);
			if (found) {
				return true;
			}
		}

		node.tree.selected.add(node.id);

		if (node === target) {
			return true;
		}
	}
	return false;
}
