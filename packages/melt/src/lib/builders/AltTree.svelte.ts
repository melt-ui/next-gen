import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";
import {
	MultiSelectionState,
	createSelectionState,
	SingleSelectionState,
} from "$lib/utils/selection-state.svelte";

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

type Selected<Multiple extends boolean | undefined> = Multiple extends true
	? MultiSelectionState
	: SingleSelectionState;

export class AltTree<Props extends _PropsExtends> {
	#props!: AltTreeProps<Props>;

	readonly items: Props["items"] = $derived(extract(this.#props.items));
	readonly multiple = $derived(
		extract(this.#props.multiple, false),
	) as Props["multiple"] extends true ? true : false;

	#selected: Selected<Props["multiple"]>;
	#expanded: MultiSelectionState;

	constructor(props: AltTreeProps<Props>) {
		this.#props = props;
		this.#selected = createSelectionState(this.multiple, {
			value: props.selected,
			onChange: props.onSelectedChange,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any) as Selected<Props["multiple"]>;
		this.#expanded = MultiSelectionState.create({
			value: props.expanded,
			onChange: props.onExpandedChange,
		});
	}

	get selected() {
		return this.#selected;
	}

	set selected() {}

	get expanded() {
		return this.#expanded;
	}
}
