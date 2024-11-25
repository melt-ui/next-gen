import type { Extracted, MaybeGetter } from "$lib/types";
import { AltSelectionState, type MaybeMultiple } from "$lib/utils/alt-selection-state.svelte";
import { extract } from "$lib/utils/extract";
import { omit } from "$lib/utils/object";
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

type Child<I extends AltTreeItem[]> = Omit<Item<I>, "children"> & {
	selected: boolean;
	expanded: boolean;
	canExpand: boolean;
	collapse: () => void;
	expand: () => void;
	toggleExpand: () => void;
	select: () => void;
	deselect: () => void;
	toggleSelect: () => void;
	focus: () => void;
	children: Child<I>[];
	parent: Child<I> | undefined;
	attrs: {
		onclick: (e: MouseEvent) => void;
		onkeydown: (e: KeyboardEvent) => void;
	};
};

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

	#getItemId(id: string): string {
		return `melt-tree-${this.#id}-item--${id}`;
	}

	#getItemEl(id: string): HTMLElement | null {
		return document.getElementById(this.#getItemId(id));
	}

	#getChild(item: Item<I>, parent?: Item<I>): Child<I> {
		const instance = this;
		return {
			...omit(item, "children"),
			get attrs() {
				return {
					id: instance.#getItemId(item.id),
					onclick: (e: MouseEvent) => {
						e.stopPropagation();
						instance.select(item.id);
						if (instance.expandOnClick) instance.toggleExpand(item.id);
						instance.#getItemEl(item.id)?.focus();
					},
					onkeydown: (e: KeyboardEvent) => {
						let shouldPrevent = true;
						switch (e.key) {
							case "ArrowLeft": {
								if (this.expanded) {
									this.collapse();
									break;
								}
								instance.#getItemEl(parent?.id ?? "")?.focus();

								break;
							}
							case "ArrowRight": {
								if (!this.canExpand) break;
								if (this.expanded) {
									this.children[0].focus();
									break;
								}
								this.expand();
								break;
							}
							case "ArrowDown": {
								this.next()?.focus();
								break;
							}
							case "ArrowUp": {
								this.previous()?.focus();
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
					tabindex: instance.isSelected(item.id) ? 0 : -1,
				};
			},
			selected: instance.isSelected(item.id),
			expanded: instance.isExpanded(item.id),
			canExpand: Boolean(item.children && item.children.length > 0),
			collapse: () => instance.collapse(item.id),
			expand: () => instance.expand(item.id),
			toggleExpand: () => instance.toggleExpand(item.id),
			select: () => instance.select(item.id),
			deselect: () => instance.deselect(item.id),
			toggleSelect: () => instance.toggleSelect(item.id),
			focus: () => instance.#getItemEl(item.id)?.focus(),
			next: () => {
				const index = instance.children.findIndex((c) => c.id === item.id);
				if (index === -1) return;
				if (index === instance.children.length - 1) return;
				return instance.children[index + 1];
			},
			previous: () => {
				const index = instance.children.findIndex((c) => c.id === item.id);
				if (index === -1) return;
				if (index === 0) return;
				return instance.children[index - 1];
			},
			get children() {
				return instance.#getChildren((item.children || []) as Items<I>, item);
			},
			get parent() {
				if (!parent) return;
				return instance.#getChild(parent);
			},
		};
	}

	#getChildren(items: Items<I>, parent?: Item<I>): Child<I>[] {
		return items.map((i) => {
			return this.#getChild(i, parent);
		});
	}

	get children() {
		return this.#getChildren(this.items);
	}
}
