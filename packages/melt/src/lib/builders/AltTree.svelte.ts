import type { MaybeGetter } from "$lib/types";
import { AltSelectionState } from "$lib/utils/alt-selection-state.svelte";
import { extract } from "$lib/utils/extract";

export interface AltTreeItem {
	id: string;
	children?: AltTreeItem[];
}
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
	selected?: MaybeGetter<(Props["multiple"] extends true ? Iterable<string> : string) | undefined>;
	/**
	 * A function that is called whenever selected changes.
	 */
	onSelectedChange?: (
		value: Props["multiple"] extends true ? Set<string> : string | undefined,
	) => void;
	/**
	 * The currently expanded items
	 */
	expanded?: MaybeGetter<Iterable<string> | undefined>;
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

type FalseIfUndefined<T extends boolean | undefined> = T extends undefined ? false : T;

type Selected<Multiple extends boolean | undefined> = AltSelectionState<FalseIfUndefined<Multiple>>;

export class AltTree<Props extends _PropsExtends> {
	#props!: AltTreeProps<Props>;

	readonly items: Props["items"] = $derived(extract(this.#props.items));
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
}
