import type { MaybeGetter } from "$lib/types";
import { useDebounce } from "runed";
import { extract } from "./extract";

type Item = { value: string; typeahead?: string; current?: boolean };

export type CreateTypeaheadArgs<T extends Item> = {
	/**
	 * How many time (in ms) the typeahead string is held before it is cleared
	 * @default 500
	 */
	timeout?: MaybeGetter<number | undefined>;
	getItems: () => T[];
};

export const letterRegex = /^[a-zA-Z]$/;

export function createTypeahead<T extends Item>(args: CreateTypeaheadArgs<T>) {
	let value = $state("");
	const timeout = $derived(extract(args.timeout, 500));
	const debounceClear = useDebounce(
		() => {
			value = "";
		},
		() => timeout,
	);

	function typeahead(letter: string) {
		if (!letterRegex.test(letter)) return;
		debounceClear();
		value += letter.toLowerCase();
		const isStartingTypeahead = value.length === 1;

		const items = args.getItems();
		const index = items.findIndex((item) => item.current);
		const itemsForTypeahead = items
			.filter((item) => {
				const searchValue = item.typeahead ?? item.value;
				return searchValue.toLowerCase().startsWith(value);
			})
			.map((item) => ({ item, index: items.indexOf(item) }));
		if (!itemsForTypeahead.length) return;

		// In case you're starting the typeahead, a different element than the first one should be focused.
		// Otherwise, if the current element matches the typed string, don't change.
		const next =
			itemsForTypeahead.find((item) => {
				if (isStartingTypeahead) return item.index > index;
				return item.index >= index;
			}) ?? itemsForTypeahead[0];

		return next?.item;
	}

	return typeahead;
}
