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
	multiple?: boolean;
	items: MaybeGetter<AltTreeItem[]>;
};

type AltTreeProps<Props extends _PropsExtends> = Props & {
	/**
	 * If `true`, the user can select multiple items.
	 *
	 * @default false
	 */
	multiple?: Props["multiple"];
	/**
	 * The currently selected item(s).
	 * If `multiple` is `true`, this should be an `Iterable`.
	 * Otherwise, it'll be a `string`.
	 *
	 * @default undefined
	 */
	selected?: MaybeMultiple<FalseIfUndefined<Props["multiple"]>>;
	/**
	 * A function that is called whenever selected changes.
	 */
	onSelectedChange?: (
		value: Props["multiple"] extends true ? Set<string> : string | undefined,
	) => void;
	/**
	 * The currently expanded items
	 */
	expanded?: MaybeMultiple<true>;
	/**
	 * A function that is called whenever expanded changes.
	 */
	onExpandedChange?: (value: Set<string>) => void;
	/**
	 * The items contained in the tree.
	 *
	 * @required
	 */
	items: Props["items"];
};

type Selected<Multiple extends boolean | undefined> = AltSelectionState<FalseIfUndefined<Multiple>>;
type Items<Props extends _PropsExtends> = Extracted<Props["items"]>;
type Item<Props extends _PropsExtends> = Items<Props>[number];

type Child<Props extends _PropsExtends> = Omit<Item<Props>, "children"> & {
	selected: boolean;
	expanded: boolean;
	collapse: () => void;
	expand: () => void;
	toggleExpand: () => void;
	select: () => void;
	deselect: () => void;
	toggleSelect: () => void;
	children: Child<Props>[];
	attrs: {
		onclickcapture: () => void;
		onkeydown: () => void;
	};
};

export class AltTree<Props extends _PropsExtends> {
	#props!: AltTreeProps<Props>;

	readonly items = $derived(extract(this.#props.items)) as Items<Props>;
	readonly multiple = $derived(
		extract(this.#props.multiple, false),
	) as Props["multiple"] extends true ? true : false;

	#selected: Selected<Props["multiple"]>;
	#expanded: AltSelectionState<true>;

	constructor(props: AltTreeProps<Props>) {
		this.#props = props;
		this.#selected = new AltSelectionState({
			value: props.selected,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onChange: props.onSelectedChange as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			multiple: () => props.multiple as any,
		}) as Selected<Props["multiple"]>;
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

	#getChildren(items: Items<Props>): Child<Props>[] {
		const instance = this;
		return items.map((i) => {
			const item = i as Item<Props>;
			return {
				...omit(item, "children"),
				get attrs() {
					return {
						onclickcapture: () => {
							instance.select(item.id);
						},
					};
				},
				selected: instance.isSelected(item.id),
				expanded: instance.isExpanded(item.id),
				collapse: () => instance.collapse(item.id),
				expand: () => instance.expand(item.id),
				toggleExpand: () => instance.toggleExpand(item.id),
				select: () => instance.select(item.id),
				deselect: () => instance.deselect(item.id),
				toggleSelect: () => instance.toggleSelect(item.id),
				get children() {
					return instance.#getChildren((item.children || []) as Items<Props>);
				},
			};
		});
	}

	get children() {
		return this.#getChildren(this.items);
	}
}
