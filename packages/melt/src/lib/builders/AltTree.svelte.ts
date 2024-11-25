import type { Extracted, MaybeGetter } from "$lib/types";
import { AltSelectionState, type MaybeMultiple } from "$lib/utils/alt-selection-state.svelte";
import { extract } from "$lib/utils/extract";
import type { FalseIfUndefined } from "$lib/utils/types";

export type AltTreeItem<Meta extends Record<string, unknown> = Record<never, never>> = {
	id: string;
	children?: AltTreeItem<Meta>[];
} & Meta;

type _PropsExtends = {
	multiple?: MaybeGetter<boolean | undefined>;
	items: MaybeGetter<AltTreeItem[]>;
};

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

	toggleSelect(id: string) {
		this.#selected.toggle(id);
	}

	getItemId(id: string): string {
		return `melt-tree-${this.#id}-item--${id}`;
	}

	getItemEl(id: string): HTMLElement | null {
		return document.getElementById(this.getItemId(id));
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
		return this.items.map((i) => new Child({ tree: this, item: i, parent: undefined }));
	}
}

type ChildProps<I extends AltTreeItem[]> = {
	tree: AltTree<I, boolean>;
	item: Item<I>;
	parent?: Child<I>;
};
class Child<I extends AltTreeItem[]> {
	#props!: ChildProps<I>;
	tree = $derived(this.#props.tree);
	item = $derived(this.#props.item);
	id = $derived(this.tree.getItemId(this.item.id));
	parent = $derived(this.#props.parent);

	constructor(props: ChildProps<I>) {
		this.#props = props;
	}

	get el() {
		return this.tree.getItemEl(this.item.id);
	}

	readonly selected = $derived(this.tree.isSelected(this.id));
	readonly expanded = $derived(this.tree.isExpanded(this.id));
	readonly canExpand = $derived(Boolean(this.item.children && this.item.children?.length > 0));
	collapse = () => this.tree.collapse(this.id);
	expand = $derived(() => this.tree.expand(this.id));
	toggleExpand = $derived(() => this.tree.toggleExpand(this.id));
	select = $derived(() => this.tree.select(this.id));
	deselect = $derived(() => this.tree.deselect(this.id));
	toggleSelect = $derived(() => this.tree.toggleSelect(this.id));
	focus = $derived(() => this.el?.focus());

	get attrs() {
		return {
			id: this.id,
			onclick: (e: MouseEvent) => {
				e.stopPropagation();
				this.tree.select(this.id);
				if (this.tree.expandOnClick) this.tree.toggleExpand(this.id);
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
						console.log(this.parent, this.parent?.el);
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
					case "ArrowDown": {
						//	this.next()?.focus();
						break;
					}
					case "ArrowUp": {
						//	this.previous()?.focus();
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
			tabindex: this.tree.isSelected(this.id) ? 0 : -1,
			role: "treeitem",
		};
	}

	get children() {
		return this.item.children?.map((i) => new Child({ tree: this.tree, item: i, parent: this }));
	}
}
