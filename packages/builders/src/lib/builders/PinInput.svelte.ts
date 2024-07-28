import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import { extract } from "$lib/utils/extract.svelte";
import { createIdentifiers } from "$lib/utils/identifiers.svelte";
import { isHtmlInputElement } from "$lib/utils/is";
import { nanoid } from "nanoid";

const identifiers = createIdentifiers("pin-input", ["root", "input"]);

export type PinInputProps = {
	/**
	 * The value for the Pin Input.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default ''
	 */
	value?: MaybeGetter<string>;
	/**
	 * Called when the `PinInput` instance tries to change the value.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * The amount of digits in the Pin Input.
	 *
	 * @default 4
	 */
	maxLength?: MaybeGetter<number>;
	/**
	 * An optional placeholder to display when the input is empty.
	 *
	 * @default '○'
	 */
	placeholder?: MaybeGetter<string>;

	/**
	 * If `true`, prevents the user from interacting with the input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean>;

	/**
	 * If the input should be masked like a password.
	 *
	 * @default false
	 */
	mask?: MaybeGetter<boolean>;

	/**
	 * What characters the input accepts.
	 *
	 * @default 'alphanumeric'
	 */
	type?: MaybeGetter<"alphanumeric" | "numeric" | "text">;
};

export class PinInput {
	#id = nanoid();

	/* Props */
	#props!: PinInputProps;
	readonly maxLength = $derived(extract(this.#props.maxLength, 4));
	readonly placeholder = $derived(extract(this.#props.placeholder, "○"));
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly mask = $derived(extract(this.#props.mask, false));
	readonly type = $derived(extract(this.#props.type, "alphanumeric"));

	/* State */
	#value!: Synced<string>;
	#focusedIndex = $state(-1);
	readonly isFilled = $derived(this.value.length === this.maxLength);

	constructor(props: PinInputProps = {}) {
		this.#value = new Synced(props.value ?? "", props.onValueChange);
		this.#props = props;
	}

	#getInputEls(): HTMLInputElement[] {
		if (!inBrowser()) return [];
		const rootEl = document.getElementById(this.#id);
		if (!rootEl) return [];
		return [...rootEl.querySelectorAll(`[${identifiers.input}]`)].filter(isHtmlInputElement);
	}

	get value() {
		return this.#value.current;
	}

	set value(value: string) {
		this.#value.current = value;
		// set values in inputs
		const inputs = this.#getInputEls();
		inputs.forEach((input, index) => {
			input.value = value[index] ?? "";
		});
	}

	/** The root element's props. */
	get root() {
		return {
			[identifiers.root]: "",
			id: this.#id,
			"data-complete": dataAttr(this.isFilled),
		} as const;
	}

	/** An array of props that should be spread to the input elements. */
	get inputs() {
		return Array(this.maxLength)
			.fill(0)
			.map((_, index) => this.#getInput(index));
	}

	#deleteCharAtIndex(index: number) {
		this.value = this.value.slice(0, index) + this.value.slice(index + 1);
	}

	#addCharAtIndex(char: string, index: number) {
		this.value = this.value.slice(0, index) + char + this.value.slice(index + 1);
	}

	#getInput(index: number) {
		const currValue = this.value[index];
		const isFilled = currValue !== undefined;
		const isFocused = this.#focusedIndex === index;
		const isLast = index === this.maxLength - 1;
		const canFocus = (this.isFilled && isLast) || index === this.value.length;

		return {
			[identifiers.input]: "",
			placeholder: isFocused ? undefined : this.placeholder,
			disabled: disabledAttr(this.disabled),
			type: this.type,
			"data-filled": dataAttr(isFilled),
			tabindex: canFocus ? 0 : -1,
			style: canFocus && isFocused && !isFilled ? undefined : "caret-color: transparent;",
			onkeydown: (e: KeyboardEvent) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}
				const inputs = this.#getInputEls();

				switch (e.key) {
					case "ArrowLeft": {
						e.preventDefault();
						inputs[index - 1]?.focus();
						break;
					}
					case "ArrowRight": {
						if (!this.value[index]) return;
						e.preventDefault();
						inputs.at(index + 1)?.focus();
						break;
					}
					case "Home": {
						e.preventDefault();
						inputs[0]?.focus();
						break;
					}
					case "End": {
						e.preventDefault();
						const lastFocusableIndex = Math.min(this.value.length, inputs.length - 1);
						inputs[lastFocusableIndex]?.focus();
						break;
					}
					case "Backspace": {
						e.preventDefault();
						if (this.value[index]) {
							this.#deleteCharAtIndex(index);
						} else {
							this.#deleteCharAtIndex(index - 1);
							setTimeout(() => inputs[index - 1]?.focus());
						}
						break;
					}
				}
			},
			onpointerdown: (e: Event) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}
				setTimeout(() => el.setSelectionRange(1, 1));

				if (this.value[index]) return;
				const inputs = this.#getInputEls();
				// Set timeout so deps can change, and canFocus is re-evaluated.
				setTimeout(() => inputs[this.value.length]?.focus());
			},
			onpointerup: (e: Event) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}
				setTimeout(() => el.setSelectionRange(1, 1));
			},
			oninput: (e: Event) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}
				e.preventDefault();
				const char = el.value.slice(el.value.length - 1);
				el.value = char;
				this.#addCharAtIndex(char, index);

				const inputs = this.#getInputEls();
				const currIndex = inputs.indexOf(el);

				// Set timeout so deps can change, and canFocus is re-evaluated.
				setTimeout(() => inputs[currIndex + 1]?.focus());
			},
			onfocus: () => {
				this.#focusedIndex = index;
			},
			onblur: () => {
				this.#focusedIndex = -1;
			},
		} as const;
	}
}
