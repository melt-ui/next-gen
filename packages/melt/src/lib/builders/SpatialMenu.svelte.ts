import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { kbd } from "$lib/utils/keyboard";
import { dequal } from "dequal";
import { createAttachmentKey } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("spatial-menu", [
	"root",
	"input",
	"item",
]);

export type SpatialMenuProps<T> = {
	/**
	 * The currently highlighted value.
	 */
	highlighted?: MaybeGetter<T | null | undefined>;

	/**
	 * Called when the highlighted value changes.
	 */
	onHighlightChange?: (highlighted: T | null) => void;

	onSelect?: (value: T) => void;
};

export class SpatialMenu<T> {
	/* Props */
	#props!: SpatialMenuProps<T>;
	onSelect = $derived(this.#props.onSelect);

	/* State */
	#elMap: {
		root?: HTMLElement;
		input?: HTMLInputElement;
	} = {};
	#items: Array<SpatialMenuItem<T>> = [];

	#highlighted: Synced<T | null>;
	get highlighted() {
		return this.#highlighted.current;
	}
	set highlighted(v) {
		this.#highlighted.current = v;
	}

	constructor(props: SpatialMenuProps<T> = {}) {
		this.#props = props;

		this.#highlighted = new Synced({
			value: props.highlighted,
			onChange: props.onHighlightChange,
			defaultValue: null,
		});
	}

	#onKeydown = (e: KeyboardEvent) => {
		const arrowKeys = [kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.ARROW_LEFT, kbd.ARROW_RIGHT] as string[];

		if (arrowKeys.includes(e.key)) {
			e.preventDefault();
			const current = this.#items.find((i) => i.highlighted);
			if (!current) this.highlighted = this.#items[0]?.value ?? null;
		}
	};

	/** The root element. */
	get root() {
		return {
			[dataAttrs.root]: "",
			tabindex: 0,
			onkeydown: this.#onKeydown,
			[createAttachmentKey()]: (node) => {
				this.#elMap.root = node;
				return () => {
					delete this.#elMap.root;
				};
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get input() {
		return {
			[dataAttrs.input]: "",
			onkeydown: this.#onKeydown,
			[createAttachmentKey()]: (node) => {
				this.#elMap.input = node;
				return () => {
					delete this.#elMap.input;
				};
			},
		} as const satisfies HTMLAttributes<HTMLInputElement>;
	}

	getItem(value: T, options?: Omit<SpatialMenuItemProps<T>, "parent" | "value">) {
		const item = new SpatialMenuItem({
			value,
			onSelect: options?.onSelect,
			parent: this,
			lifecycle: {
				onMount: () => {
					this.#items.push(item);
				},
				onUnmount: () => {
					this.#items = this.#items.filter((i) => i !== item);
				},
			},
		});

		return item;
	}
}

type SpatialMenuItemProps<T> = {
	value: T;
	onSelect?: () => void;
	parent: SpatialMenu<T>;
	lifecycle: {
		onMount: () => void;
		onUnmount: () => void;
	};
};

class SpatialMenuItem<T> {
	#props!: SpatialMenuItemProps<T>;
	value = $derived(this.#props.value);

	el: HTMLElement | null = null;
	parent = $derived(this.#props.parent);
	highlighted = $derived(dequal(this.parent.highlighted, this.#props.value));

	constructor(props: SpatialMenuItemProps<T>) {
		this.#props = props;
	}

	get attrs() {
		return {
			[dataAttrs.item]: "",
			"data-highlighted": dataAttr(this.highlighted),
			[createAttachmentKey()]: (node) => {
				this.el = node;
				this.#props.lifecycle.onMount();

				return () => {
					this.el = null;
					this.#props.lifecycle.onUnmount();
				};
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get rect() {
		return this.el?.getBoundingClientRect();
	}

	onSelect() {
		this.#props.onSelect?.();
		this.#props.parent.onSelect?.(this.#props.value);
	}
}

