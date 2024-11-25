import type { Extracted, MaybeGetter } from "$lib/types";
import { AltSelectionState, type MaybeMultiple } from "$lib/utils/alt-selection-state.svelte";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { first, last } from "$lib/utils/iterator";
import { isControlOrMeta } from "$lib/utils/platform";
import type { FalseIfUndefined } from "$lib/utils/types";

export type AltTreeItem<Meta extends Record<string, unknown> = Record<never, never>> = {
	id: string;
	children?: AltTreeItem<Meta>[];
} & Meta;

type AltTreeProps<Items extends AltTreeItem[], Multiple extends boolean = false> = {
	/**
	 * If `true`, the user can select multiple items.
	 *
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;
	/**
	 * The currently selected item(s).
	 * If `multiple` is `true`, this should be an `Iterable`.
	 * Otherwise, it'll be a `string`.
	 *
	 * @default undefined
	 */
	selected?: MaybeMultiple<Multiple>;
	/**
	 * A function that is called whenever selected changes.
	 */
	onSelectedChange?: (value: Multiple extends true ? Set<string> : string | undefined) => void;
	/**
	 * The currently expanded items
	 */
	expanded?: MaybeMultiple<true>;
	/**
	 * A function that is called whenever expanded changes.
	 */
	onExpandedChange?: (value: Set<string>) => void;

	/**
	 * If `true`, groups (items with children) expand on click.
	 *
	 * @default true
	 */
	expandOnClick?: MaybeGetter<boolean | undefined>;
	/**
	 * The items contained in the tree.
	 *
	 * @required
	 */
	items: Items;
};

type Selected<Multiple extends boolean | undefined> = AltSelectionState<FalseIfUndefined<Multiple>>;
type Items<I extends AltTreeItem[]> = Extracted<AltTreeProps<I>["items"]>;
type Item<I extends AltTreeItem[]> = Items<I>[number];

export class AltTree<I extends AltTreeItem[], M extends boolean = false> {
	#props!: AltTreeProps<I, M>;

	readonly items = $derived(extract(this.#props.items)) as Items<I>;
	readonly multiple = $derived(extract(this.#props.multiple, false as M)) as M;

	readonly expandOnClick = $derived(extract(this.#props.expandOnClick, true));
	#selected: Selected<M>;
	#expanded: AltSelectionState<true>;

	#id = crypto.randomUUID();

	constructor(props: AltTreeProps<I, M>) {
		this.#props = props;
		this.#selected = new AltSelectionState({
			value: props.selected,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onChange: props.onSelectedChange as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			multiple: props.multiple as any,
		}) as Selected<M>;
		this.#expanded = new AltSelectionState({
			value: props.expanded,
			onChange: props.onExpandedChange,
			multiple: true,
		});
	}

	get selected() {
		return this.#selected.current;
	}

	set selected(v) {
		this.#selected.current = v;
	}

	get expanded() {
		return this.#expanded.current;
	}

	set expanded(v) {
		this.#expanded.current = v;
	}

	isSelected(id: string) {
		return this.#selected.has(id);
	}

	isExpanded(id: string) {
		return this.#expanded.has(id);
	}

	expand(id: string) {
		this.#expanded.add(id);
	}

	collapse(id: string) {
		this.#expanded.delete(id);
	}

	toggleExpand(id: string) {
		this.#expanded.toggle(id);
	}

	select(id: string) {
		this.#selected.add(id);
	}

	deselect(id: string) {
		this.#selected.delete(id);
	}

	clearSelection() {
		this.#selected.clear();
	}

	toggleSelect(id: string) {
		this.#selected.toggle(id);
	}

	getItemId(id: string): string {
		return `melt-tree-${this.#id}-item--${id}`;
	}

	getItemEl(id: string): HTMLElement | null {
		return document.getElementById(this.getItemId(id));
	}

	allChildren() {
		return this.children.flat();
	}

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

		console.log({ from: from.id, to: to.id, start: start.id, end: end.id });

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

	get root() {
		return {
			role: "tree",
		};
	}

	get group() {
		return {
			role: "group",
		};
	}

	get children() {
		return this.items.map(
			(i) => new Child({ tree: this, item: i, parent: this, selectedState: this.#selected }),
		);
	}
}

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
class Child<I extends AltTreeItem[]> {
	#props!: ChildProps<I>;
	tree = $derived(this.#props.tree);
	selectedState = $derived(this.#props.selectedState);
	item = $derived(this.#props.item);
	elId = $derived(this.tree.getItemId(this.item.id));
	id = $derived(this.item.id);
	parent = $derived(this.#props.parent);

	constructor(props: ChildProps<I>) {
		this.#props = props;
	}

	get el() {
		return document.getElementById(this.elId);
	}

	readonly selected = $derived(this.tree.isSelected(this.id));
	readonly expanded = $derived(this.tree.isExpanded(this.id));
	readonly canExpand = $derived(Boolean(this.item.children && this.item.children?.length > 0));
	collapse = () => this.tree.collapse(this.id);
	expand = () => this.tree.expand(this.id);
	toggleExpand = () => this.tree.toggleExpand(this.id);
	select = () => this.tree.select(this.id);
	deselect = () => this.tree.deselect(this.id);
	toggleSelect = () => this.tree.toggleSelect(this.id);
	focus = () => this.el?.focus();
	idx = $derived(this.parent?.children?.findIndex((c) => c.id === this.id) ?? -1);

	get previousSibling() {
		return this.parent?.children?.[this.idx - 1];
	}

	get nextSibling() {
		return this.parent?.children?.[this.idx + 1];
	}

	get previous(): Child<I> | undefined {
		let current = this.previousSibling;
		if (!current) return this.parent instanceof Child ? this.parent : undefined;
		while (current?.expanded) {
			current = last(current?.children ?? []);
		}
		return current;
	}

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

	get tabindex() {
		if (this.selectedState.size()) {
			return this.tree.isSelected(this.id) ? 0 : -1;
		}
		return this.parent instanceof AltTree && this.idx === 0 ? 0 : -1;
	}

	get attrs() {
		return {
			id: this.elId,
			"data-selected": dataAttr(this.selected),
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
				// TODO: a-z, *
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
						break;
					}
					case "ArrowDown": {
						this.next?.focus();
						break;
					}
					case "Enter":
					case " ": {
						this.tree.clearSelection();
						this.select();

						break;
					}
					default: {
						shouldPrevent = false;
					}
				}

				if (shouldPrevent) {
					e.preventDefault();
					e.stopPropagation();
				}
			},
			tabindex: this.tabindex,
			role: "treeitem",
		};
	}

	get children() {
		return this.item.children?.map((i) => new Child({ ...this.#props, item: i, parent: this }));
	}
}
