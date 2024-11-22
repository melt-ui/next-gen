export interface AltTreeItem {
	id: string;
	children?: AltTreeItem[];
}
type _PropsExtends = {
	multiple?: boolean;
	items: AltTreeItem[];
};

type AltTreeProps<Props extends _PropsExtends> = Props & {
	/**
	 * If `true`, the user can select multiple items.
	 *
	 * @default false
	 */
	multiple?: Props["multiple"];
	selected?: Props["multiple"] extends true ? Iterable<string> | undefined : string | undefined;
	items: Props["items"];
};

export class AltTree<Props extends _PropsExtends> {
	#props!: AltTreeProps<Props>;
	constructor(props: AltTreeProps<Props>) {
		this.#props = props;
	}
	get selected() {
		return this.#props.selected;
	}
}
