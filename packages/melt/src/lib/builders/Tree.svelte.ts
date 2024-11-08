import type { MaybeGetter } from "$lib/types.js";
import { extract } from "$lib/utils/extract.svelte.js";
import { createDataIds } from "$lib/utils/identifiers.svelte.js";
import { isControlOrMeta } from "$lib/utils/platform.js";
import { toggle } from "$lib/utils/set.js";
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
	#state: TreeState<Value>;

	constructor(props: TreeProps<Value>) {
		this.#state = new TreeState(props);
	}

	get roots(): ReadonlyArray<TreeItem<Value>> {
		return this.#state.roots;
	}

	get selectionBehavior(): TreeSelectionBehavior {
		return this.#state.selectionBehavior;
	}

	get selected(): SvelteSet<string> {
		return this.#state.selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#state.expanded;
	}

	props() {
		return {
			[dataIds.tree]: "",
			role: "tree",
			"aria-multiselectable": this.selectionBehavior === "toggle",
		} as const;
	}
}

class TreeState<Value> {
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
		return this.createTreeItems(data);
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

	get tabbable(): string | undefined {
		return this.#tabbable ?? this.roots[0]?.id;
	}

	set tabbable(value: string) {
		this.#tabbable = value;
	}

	createTreeItems(
		data: TreeData<Value>,
		parent?: TreeItem<Value>,
	): Array<TreeItem<Value>> {
		return data.map((item, index) => {
			const { id, value, children = [] } = item;
			return new TreeItem(this, id, value, index, parent, children);
		});
	}

	treeItemElementId(item: TreeItem<Value>): string {
		return `${this.#id}:${item.id}`;
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

	selectAll(nodes: ReadonlyArray<TreeItem<Value>> = this.roots): void {
		for (const node of nodes) {
			this.selected.add(node.id);

			if (node.expanded) {
				this.selectAll(node.children);
			}
		}
	}

	selectFromStartUntil(
		target: TreeItem<Value>,
		nodes: ReadonlyArray<TreeItem<Value>> = this.roots,
	): boolean {
		for (const node of nodes) {
			this.selected.add(node.id);

			if (node === target) {
				return true;
			}

			if (node.expanded) {
				const found = this.selectFromStartUntil(target, node.children);
				if (found) {
					return true;
				}
			}
		}
		return false;
	}

	selectFromEndUntil(
		target: TreeItem<Value>,
		nodes: ReadonlyArray<TreeItem<Value>> = this.roots,
	): boolean {
		for (let i = nodes.length - 1; i >= 0; i--) {
			const node = nodes[i];

			if (node.expanded) {
				const found = this.selectFromEndUntil(target, node.children);
				if (found) {
					return true;
				}
			}

			this.selected.add(node.id);

			if (node === target) {
				return true;
			}
		}
		return false;
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

	readonly selected: boolean = $derived.by(() =>
		this.#state.selected.has(this.id),
	);

	readonly expanded: boolean = $derived.by(() =>
		this.#state.expanded.has(this.id),
	);

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
		const elementId = this.#state.treeItemElementId(this);
		return document.getElementById(elementId);
	}

	props() {
		return {
			[dataIds.item]: "",
			id: this.#state.treeItemElementId(this),
			role: "treeitem",
			"aria-selected": this.selected,
			"aria-expanded": this.children.length !== 0 ? this.expanded : undefined,
			"aria-level": this.level,
			"aria-posinset": this.index + 1,
			"aria-setsize": this.siblings.length,
			tabindex: this.#state.tabbable === this.id ? 0 : -1,
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

						if (this.#state.selectionBehavior === "toggle" && event.shiftKey) {
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
							this.#state.selectionBehavior === "toggle" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							this.#state.selectFromStartUntil(this);
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
							this.#state.selectionBehavior === "toggle" &&
							event.shiftKey &&
							isControlOrMeta(event)
						) {
							this.#state.selectFromEndUntil(this);
						}
						break;
					}
					case " ": {
						const { selectionBehavior, selected } = this.#state;
						if (selectionBehavior === "toggle") {
							toggle(selected, this.id);
						} else {
							selected.clear();
							selected.add(this.id);
						}
						break;
					}
					case "a": {
						if (
							this.#state.selectionBehavior === "toggle" &&
							isControlOrMeta(event)
						) {
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
			onclick: (event: MouseEvent) => {
				const { selectionBehavior, selected } = this.#state;
				if (selectionBehavior === "toggle" && isControlOrMeta(event)) {
					toggle(selected, this.id);
				} else {
					selected.clear();
					selected.add(this.id);
				}

				event.stopPropagation();
			},
			onfocusin: (event: FocusEvent) => {
				this.#state.tabbable = this.id;
				event.stopPropagation();
			},
		} as const;
	}

	select(): void {
		const { selectionBehavior, selected } = this.#state;
		if (selectionBehavior === "replace") {
			selected.clear();
		}
		selected.add(this.id);
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
