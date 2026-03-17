import { Synced } from "$lib/Synced.svelte";
import type { Getter, MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { getDirectionalKeys, kbd } from "$lib/utils/keyboard";
import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";
import { Toggle } from "./Toggle.svelte";

const metadata = createBuilderMetadata("toggle-group", ["root", "item", "label", "hidden-input"]);

export type ToggleGroupProps = {
	/**
	 * Whether the toggle(s) should allow multiple selection or just a single selection.
	 * In 'single' mode, selecting one toggle will deselect any previously selected toggle.
	 * In 'multiple' mode, toggles can be selected and deselected independently.
	 *
	 * @default "single"
	 */
	type?: MaybeGetter<"single" | "multiple" | undefined>;

	/**
	 * The orientation of the toggle group.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;

	/**
	 * If `true`, prevents the user from interacting with the toggle group.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * If the the item navigation should loop when using arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;

	/**
	 * If `true`, requires at least one option to be selected.
	 * In single mode, when required=true, the user won't be able to deselect an option without selecting another.
	 * In multiple mode, at least one option must be selected.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * The controlled value of the toggle group.
	 * If the type is 'single', it should be a string.
	 * If the type is 'multiple', it should be an array of strings.
	 */
	value?: MaybeGetter<string | string[] | undefined>;

	/**
	 * Called when the value changes.
	 */
	onValueChange?: (value: string | string[]) => void;

	/**
	 * Input name for the form hidden inputs.
	 */
	name?: MaybeGetter<string | undefined>;

	/**
	 * The default item to be selected when the component is first rendered
	 * and required is true. This is only used if no value is provided.
	 */
	defaultItem?: MaybeGetter<string | undefined>;
};

export class ToggleGroup {
	ids = $state(metadata.createIds());

	#props!: ToggleGroupProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));
	readonly type = $derived(extract(this.#props.type, "single"));
	readonly loop = $derived(extract(this.#props.loop, true));
	readonly required = $derived(extract(this.#props.required, false));
	readonly name = $derived(extract(this.#props.name, ""));
	readonly defaultItem = $derived(extract(this.#props.defaultItem, ""));

	#value: Synced<string | string[]>;

	constructor(props: ToggleGroupProps = {}) {
		this.#props = props;

		let defaultValue: string | string[] = this.type === "multiple" ? [] : "";

		if (this.required && !props.value) {
			const defaultItem = this.defaultItem;
			if (defaultItem) {
				defaultValue = this.type === "multiple" ? [defaultItem] : defaultItem;
			}
		}

		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue,
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: string | string[]) {
		this.#value.current = value;
	}

	isSelected(itemValue: string): boolean {
		if (this.type === "multiple") {
			return Array.isArray(this.value) && this.value.includes(itemValue);
		}
		return this.value === itemValue;
	}

	toggle(itemValue: string): void {
		if (this.disabled) return;

		if (this.type === "multiple") {
			const currentValue = Array.isArray(this.value) ? this.value : [];
			if (currentValue.includes(itemValue)) {
				if (this.required && currentValue.length <= 1) {
					return;
				}
				this.value = currentValue.filter((value) => value !== itemValue);
			} else {
				this.value = [...currentValue, itemValue];
			}
		} else {
			if (this.value === itemValue && !this.required) {
				this.value = "";
			} else {
				this.value = itemValue;
			}
		}
	}

	get #sharedAttrs() {
		return {
			"data-orientation": dataAttr(this.orientation),
			"data-disabled": disabledAttr(this.disabled),
		} as const;
	}

	get root() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-labelledby": this.ids.label,
			"aria-required": this.required,
			"data-required": dataAttr(this.required),
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get label() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			for: this.ids.root,
			onclick: (e) => {
				if (this.disabled) return;

				const el = e.currentTarget;
				if (!isHtmlElement(el)) return;
				const root = el.closest(metadata.dataSelectors.root);
				if (!isHtmlElement(root)) return;
				const item = root.querySelector(metadata.dataSelectors.item);
				if (isHtmlElement(item)) item.focus();
			},
		} as const satisfies HTMLLabelAttributes;
	}

	getItem(item: string) {
		return new ToggleGroupItem({
			group: this,
			item,
			getSharedAttrs: () => this.#sharedAttrs,
		});
	}

	get hiddenInput() {
		if (this.type === "multiple" && Array.isArray(this.value)) {
			return this.value.map(
				(val) =>
					({
						[metadata.dataAttrs["hidden-input"]]: "",
						type: "hidden",
						name: this.name,
						value: val,
						disabled: this.disabled,
						required: this.value.length === 0 && this.required,
					}) as const satisfies HTMLInputAttributes,
			);
		}

		return {
			[metadata.dataAttrs["hidden-input"]]: "",
			type: "hidden",
			name: this.name,
			value: typeof this.value === "string" ? this.value : "",
			disabled: this.disabled,
			required: this.required && !this.value,
		} as const satisfies HTMLInputAttributes;
	}
}

type ToggleGroupItemProps = {
	group: ToggleGroup;
	item: string;
	getSharedAttrs: Getter<HTMLAttributes<HTMLElement>>;
};

class ToggleGroupItem {
	#props!: ToggleGroupItemProps;
	#toggle!: Toggle;

	readonly #group = $derived(this.#props.group);
	readonly value = $derived(this.#props.item);
	readonly pressed = $derived(this.#group.isSelected(this.value));
	readonly disabled = $derived(this.#group.disabled);

	constructor(props: ToggleGroupItemProps) {
		this.#props = props;

		this.#toggle = new Toggle({
			value: () => this.pressed,
			onValueChange: () => {
				this.#group.toggle(this.value);
			},
			disabled: () => this.disabled,
		});
	}

	#handleKeyNavigation(e: KeyboardEvent) {
		const el = e.currentTarget;
		if (!isHtmlElement(el)) return;

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

		let itemToFocus: HTMLElement | undefined;
		switch (e.key) {
			case nextKey: {
				e.preventDefault();
				const nextIdx = currentIdx + 1;
				if (nextIdx >= items.length && loop) {
					itemToFocus = items[0];
				} else if (nextIdx < items.length) {
					itemToFocus = items[nextIdx];
				}
				break;
			}
			case prevKey: {
				e.preventDefault();
				const prevIdx = currentIdx - 1;
				if (prevIdx < 0 && loop) {
					itemToFocus = items[items.length - 1];
				} else if (prevIdx >= 0) {
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
		}
	}

	get attrs() {
		const toggleAttrs = this.#toggle.trigger;

		return {
			...toggleAttrs,
			...this.#props.getSharedAttrs(),
			[metadata.dataAttrs.item]: "",
			"data-value": dataAttr(this.value),
			"data-state": dataAttr(this.pressed ? "on" : "off"),
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					if (!this.disabled) {
						this.#group.toggle(this.value);
					}
					return;
				}

				this.#handleKeyNavigation(e);
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}
