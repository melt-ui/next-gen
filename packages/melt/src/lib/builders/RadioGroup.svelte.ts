import { Synced } from "$lib/Synced.svelte";
import type { Getter, MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata, createDataIds, createIds } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { getDirectionalKeys, kbd } from "$lib/utils/keyboard";
import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

const metadata = createBuilderMetadata("radio-group", ["root", "item", "label", "hidden-input"]);

export type RadioGroupProps = {
	/**
	 * If `true`, prevents the user from interacting with the group.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
	/**
	 * If `true`, indicates that the user must select a radio button before
	 * the owning form can be submitted.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;
	/**
	 * If the the button selection should loop when navigating with the arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
	/**
	 * If `true`, the value will be changed whenever a button is focused.
	 *
	 * @default true
	 */
	selectWhenFocused?: MaybeGetter<boolean | undefined>;
	/**
	 * The orientation of the slider.
	 *
	 * @default "vertical"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;
	/**
	 * Input name for radio group.
	 */
	name?: MaybeGetter<string | undefined>;
	/**
	 * Default value for radio group.
	 *
	 * @default ""
	 */
	value?: MaybeGetter<string | undefined>;
	/**
	 * Called when the radio button is clicked.
	 */
	onValueChange?: (active: string) => void;
};

export class RadioGroup {
	#ids = metadata.createIds();

	/* Props */
	#props!: RadioGroupProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly required = $derived(extract(this.#props.required, false));
	readonly loop = $derived(extract(this.#props.loop, true));
	readonly selectWhenFocused = $derived(extract(this.#props.selectWhenFocused, true));
	readonly orientation = $derived(extract(this.#props.orientation, "vertical"));

	/* State */
	#value: Synced<string>;

	constructor(props: RadioGroupProps) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "",
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: string) {
		this.#value.current = value;
	}

	get #sharedAttrs() {
		return {
			"data-orientation": dataAttr(this.orientation),
			"data-disabled": disabledAttr(this.disabled),
			"data-value": this.value,
		};
	}

	get root() {
		// TODO: add attachment and check if aria-label is present. Otherwise, use aria-labelledby
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs["root"]]: "",
			id: this.#ids.root,
			role: "radiogroup",
			"aria-required": this.required,
			"aria-labelledby": this.#ids.label,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get label() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.label]: "",
			id: this.#ids.label,
			for: this.#ids.root,
			onclick: (e) => {
				if (this.disabled) return;

				// focus the selected item
				const el = e.currentTarget;
				if (!isHtmlElement(el)) return;
				const root = el.closest(metadata.dataSelectors.root);
				if (!isHtmlElement(root)) return;
				const item = root.querySelector(
					metadata.dataSelectors.item + `[data-value="${dataAttr(this.value)}"]`,
				);
				if (isHtmlElement(item)) item.focus();
			},
		} as const satisfies HTMLLabelAttributes;
	}

	getItem(item: string) {
		return new RadioItem({ group: this, item, getSharedAttrs: () => this.#sharedAttrs });
	}

	get hiddenInput() {
		return {
			[metadata.dataAttrs["hidden-input"]]: "",
			disabled: this.disabled,
			required: this.required,
			hidden: true,
			"aria-hidden": true,
			tabindex: -1,
			value: this.value,
			name: extract(this.#props.name),
		} as const satisfies HTMLInputAttributes;
	}

	select(item: string) {
		if (this.disabled) return;
		this.value = item;
	}
}

type RadioItemProps = {
	group: RadioGroup;
	item: string;
	getSharedAttrs: Getter<HTMLAttributes<HTMLElement>>;
};

class RadioItem {
	#props!: RadioItemProps;

	#group = $derived(this.#props.group);
	readonly value = $derived(this.#props.item);
	readonly checked = $derived(this.#group.value === this.value);

	constructor(props: RadioItemProps) {
		this.#props = props;
	}

	#select(e: Event) {
		if (this.#group.disabled) return;

		this.#group.select(this.value);
		const el = e.currentTarget;
		if (!isHtmlElement(el)) return;
		el.focus();
	}

	get attrs() {
		return {
			...this.#props.getSharedAttrs(),
			[metadata.dataAttrs["item"]]: "",
			"data-value": dataAttr(this.value),
			"data-state": dataAttr(this.checked ? "checked" : "unchecked"),
			"aria-checked": this.checked,
			role: "radio",
			tabindex: 0,
			onclick: (e) => {
				this.#select(e);
			},
			onkeydown: (e) => {
				if (e.key === kbd.SPACE) {
					e.preventDefault();
					this.#select(e);
					return;
				}

				const el = e.currentTarget;
				const root = el.closest(metadata.dataSelectors.root);
				if (!isHtmlElement(root)) return;

				const items = Array.from(root.querySelectorAll(metadata.dataSelectors.item)).filter(
					(el): el is HTMLElement => isHtmlElement(el) && !el.hasAttribute("data-disabled"),
				);
				const currentIdx = items.indexOf(el);
				const loop = this.#group.loop;

				const style = window.getComputedStyle(el);
				const dir = style.getPropertyValue("direction") as "ltr" | "rtl";
				const { nextKey, prevKey } = getDirectionalKeys(dir, this.#group.orientation);

				let itemToFocus: HTMLElement;
				switch (e.key) {
					case nextKey: {
						e.preventDefault();
						const nextIdx = currentIdx + 1;
						if (nextIdx >= items.length && loop) {
							itemToFocus = items[0];
						} else {
							itemToFocus = items[nextIdx];
						}
						break;
					}
					case prevKey: {
						e.preventDefault();
						const prevIdx = currentIdx - 1;
						if (prevIdx < 0 && loop) {
							itemToFocus = items[items.length - 1];
						} else {
							itemToFocus = items[prevIdx];
						}
						break;
					}
					case kbd.HOME: {
						e.preventDefault();
						itemToFocus = items[0];
						break;
					}
					case kbd.END: {
						e.preventDefault();
						itemToFocus = items[items.length - 1];
						break;
					}
					default: {
						return;
					}
				}

				if (itemToFocus) {
					itemToFocus.focus();
					if (this.#group.selectWhenFocused) this.#group.select(itemToFocus.dataset.value!!);
				}
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}
