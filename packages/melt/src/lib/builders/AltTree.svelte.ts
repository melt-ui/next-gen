export interface AltTreeItem {
	id: string;
	children?: AltTreeItem[];
}
type _PropsExtends = {
	/**
	 * If true, the user can select multiple items.
	 *
	 * @default false
	 */
	multiple?: boolean;
	items?: AltTreeItem[];
};

type AltTreeProps<Props extends _PropsExtends> = Props & {
	/**
	 * If true, the user can select multiple items.
	 *
	 * @default false
	 */
	multiple?: Props["multiple"];
	selected?: Props["multiple"] extends true ? Iterable<string> | undefined : string | undefined;
	items: Props["items"] extends undefined ? AltTreeItem[] : Props["items"];
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

/** test type */
type Expect<T extends true> = T;
type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

const definedParams = new AltTree<{ multiple: true; items: AltTreeItem[] }>({
	items: [{ id: "1" }],
	multiple: true,
});
type _test1 = Expect<Equal<typeof definedParams.selected, Iterable<string> | undefined>>;

// @ts-expect-error - this is a test
const shouldError = new AltTree<{ multiple: true; items: AltTreeItem[] }>({
	items: [{ id: "1" }],
});
type _test2 = Expect<Equal<typeof shouldError.selected, Iterable<string> | undefined>>;

const undefinedParams = new AltTree({ items: [{ id: "1" }], multiple: true });
type _test3 = Expect<Equal<typeof undefinedParams.selected, Iterable<string> | undefined>>;

const undefSingle = new AltTree({ items: [{ id: "1" }] });
type _test4 = Expect<Equal<typeof undefSingle.selected, string | undefined>>;

const undefSingle2 = new AltTree({
	items: [],
});
type _test5 = Expect<Equal<typeof undefSingle2.selected, string | undefined>>;

const defined2 = new AltTree<{ items: AltTreeItem[] }>({
	items: [{ id: "1" }],
});
type _test6 = Expect<Equal<typeof defined2.selected, string | undefined>>;

const defined3 = new AltTree<{ multiple: true }>({
	items: [{ id: "1" }],
	multiple: true,
});
type _test7 = Expect<Equal<typeof defined3.selected, Iterable<string> | undefined>>;

const shouldAlsoError = new AltTree({});
type _test8 = Expect<Equal<typeof shouldAlsoError.selected, string | undefined>>;
