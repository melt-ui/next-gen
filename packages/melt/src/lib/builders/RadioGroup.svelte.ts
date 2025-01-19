import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { getDirectionalKeys, kbd } from "$lib/utils/keyboard";
import type {
	HTMLAttributes,
	HTMLButtonAttributes,
	HTMLInputAttributes,
	HTMLLabelAttributes,
} from "svelte/elements";

const identifiers = createDataIds("radio-group", ["root", "item", "label", "hidden-input"]);

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
	name?: MaybeGetter<string | undefined>;
	/**
	 * The default value for
	 */
	value?: MaybeGetter<string | undefined>;
	/**
	 * Array of all possible values.
	 */
	items: MaybeGetter<string[]>;
	/**
	 * Called when the radio button is clicked.
	 */
	onValueChange?: (active: string) => void;
};

export class RadioGroup {
	/* Props */
	#props!: RadioGroupProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly required = $derived(extract(this.#props.required, false));
	readonly loop = $derived(extract(this.#props.loop, false));
	readonly selectWhenFocused = $derived(extract(this.#props.selectWhenFocused, true));
	readonly orientation = $derived(extract(this.#props.orientation, "vertical"));

	/* State */
	#value: Synced<string>;

	constructor(props: RadioGroupProps) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: extract(props.items)[0],
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: string) {
		this.#value.current = value;
	}

	get root() {
		return {
			[identifiers["root"]]: "",
			role: "radiogroup",
			"data-orientation": dataAttr(this.orientation),
			"aria-required": this.required,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get items() {
		return extract(this.#props.items).map((item) => new RadioItem({ group: this, item }));
	}

	get hiddenInput() {
		return {
			[identifiers["hidden-input"]]: "",
			disabled: this.disabled,
			required: this.required,
			hidden: true,
			"aria-hidden": true,
			tabindex: -1,
			value: this.value,
			name: extract(this.#props.name),
		} as const satisfies HTMLInputAttributes;
	}

	select(id: string) {
		if (extract(this.#props.items).includes(id)) {
			this.value = id;
		}
	}
}

type RadioItemProps = {
	group: RadioGroup;
	item: string;
};

class RadioItem {
	#props!: RadioItemProps;

	#group = $derived(this.#props.group);
	readonly item = $derived(this.#props.item);
	readonly checked = $derived(this.#group.value === this.item);

	constructor(props: RadioItemProps) {
		this.#props = props;
	}

	get button() {
		return {
			id: this.item,
			[identifiers["item"]]: "",
			disabled: this.#group.disabled,
			"data-value": dataAttr(this.item),
			"data-orientation": dataAttr(this.#group.orientation),
			"data-disabled": disabledAttr(this.#group.disabled),
			"data-state": dataAttr(this.checked ? "checked" : "unchecked"),
			"aria-checked": this.checked,
			"aria-labelledby": `${this.item}-label`,
			type: "button",
			role: "radio",
			onclick: () => {
				this.#group.select(this.item);
			},
			onkeydown: (e) => {
				const el = e.currentTarget;
				const root = el.closest("[data-melt-radio-group-root]");
				if (!isHtmlElement(root)) return;

				if (e.key === kbd.SPACE) {
					this.#group.select(el.id);
					return;
				}

				const items = Array.from(root.querySelectorAll("[data-melt-radio-group-item]")).filter(
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
					if (this.#group.selectWhenFocused) this.#group.select(itemToFocus.id);
				}
			},
		} as const satisfies HTMLButtonAttributes;
	}

	get label() {
		return {
			for: this.item,
			id: `${this.item}-label`,
		} as const satisfies HTMLLabelAttributes;
	}
}
