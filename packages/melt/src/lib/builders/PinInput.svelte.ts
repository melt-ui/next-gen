import { Synced } from "$lib/Synced.svelte";
import type { Extracted, MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlInputElement } from "$lib/utils/is";
import type { HTMLInputAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("pin-input", [
	"root",
	"input",
]);
export type PinInputError = {
	method: "paste" | "input";
	message: string;
};

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
	value?: MaybeGetter<string | undefined>;
	/**
	 * Called when the `PinInput` instance tries to change the value.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * Called when the `PinInput` instance is filled.
	 */
	onComplete?: (value: string) => void;

	/**
	 * Override the default behavior when pasting a value.
	 *
	 * @param value The pasted value.
	 *
	 * @example ```ts
	 * const pin = new PinInput({
	 *   onPaste(value) {
	 *     if (!valid(value)) {
	 *       // do something
	 *       return
	 *     }
	 *     pin.value = value
	 *   }
	 * });
	 */
	onPaste?: (value: string) => void;

	/**
	 * Called when the PinInput encounters an error.
	 */
	onError?: (error: PinInputError) => void;

	/**
	 * The amount of digits in the Pin Input.
	 *
	 * @default 4
	 */
	maxLength?: MaybeGetter<number | undefined>;
	/**
	 * An optional placeholder to display when the input is empty.
	 *
	 * @default '○'
	 */
	placeholder?: MaybeGetter<string | undefined>;

	/**
	 * If `true`, prevents the user from interacting with the input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * If the input should be masked like a password.
	 *
	 * @default false
	 */
	mask?: MaybeGetter<boolean | undefined>;

	/**
	 * What characters the input accepts.
	 *
	 * @default 'text'
	 */
	type?: MaybeGetter<"alphanumeric" | "numeric" | "text" | undefined>;

	/**
	 * If `true`, allows pasting values from the clipboard.
	 *
	 * @default true
	 */
	allowPaste?: MaybeGetter<boolean | undefined>;
};

function validateInput(char: string, type: Extracted<PinInputProps["type"]>) {
	switch (type) {
		case "alphanumeric":
			return /^[a-zA-Z0-9]$/.test(char);
		case "numeric":
			return /^[0-9]$/.test(char);
		case "text":
			return true;
	}
}

function setInputSelectionRange(input: HTMLInputElement, start: number, end: number) {
	setTimeout(() => {
		if (input.value.length === 0) return;
		if (input.selectionStart === start && input.selectionEnd === end) return;
		input.setSelectionRange(start, end);
	});
}

export class PinInput {
	#ids = createIds();

	/* Props */
	#props!: PinInputProps;
	readonly maxLength = $derived(extract(this.#props.maxLength, 4));
	readonly placeholder = $derived(extract(this.#props.placeholder, "○"));
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly mask = $derived(extract(this.#props.mask, false));
	readonly type = $derived(extract(this.#props.type, "text"));
	readonly allowPaste = $derived(extract(this.#props.allowPaste, true));

	/* State */
	#value!: Synced<string>;
	#focusedIndex = $state(-1);
	readonly isFilled = $derived(this.value.length === this.maxLength);

	constructor(props: PinInputProps = {}) {
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "",
			equalityCheck: true,
		});
		this.#props = props;
	}

	#getInputEls(): HTMLInputElement[] {
		if (!inBrowser()) return [];
		const rootEl = document.getElementById(this.#ids.root);
		if (!rootEl) return [];
		return [...rootEl.querySelectorAll(dataSelectors.input)].filter(isHtmlInputElement);
	}

	get value() {
		return this.#value.current;
	}

	set value(value: string) {
		const prev = this.#value.current;
		this.#value.current = value;
		// set values in inputs
		const inputs = this.#getInputEls();
		inputs.forEach((input, index) => {
			input.value = value[index] ?? "";
		});

		const completed = prev.length !== value.length && value.length === this.maxLength;
		if (completed) {
			this.#props.onComplete?.(value);
		}
	}

	/** The root element's props. */
	get root() {
		return {
			[dataAttrs.root]: "",
			id: this.#ids.root,
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

		const onpaste = (pasted: string) => {
			if (!this.allowPaste) return;

			const inputs = this.#getInputEls();
			if (!inputs.length) return;

			const focusedIndex = Math.max(this.#focusedIndex, 0);
			const initialIndex = pasted.length >= inputs.length ? 0 : focusedIndex;
			const lastIndex = Math.min(initialIndex + pasted.length, inputs.length);

			const valid = pasted.split("").every((char) => validateInput(char, this.type));
			if (!valid) {
				this.#props.onError?.({
					method: "paste",
					message: `Input did not match the type ${this.type}`,
				});
				return;
			}

			for (let i = initialIndex; i < lastIndex; i++) {
				const input = inputs[i];
				if (!input) continue;

				input.value = pasted[i - initialIndex] ?? "";
				this.#addCharAtIndex(pasted[i - initialIndex] ?? "", i);
			}
			inputs[lastIndex]?.focus();
		};

		return {
			[dataAttrs.input]: "",
			placeholder: isFocused ? undefined : this.placeholder,
			disabled: disabledAttr(this.disabled),
			type: this.mask ? "password" : "text",
			"data-filled": dataAttr(isFilled),
			tabindex: canFocus ? 0 : -1,
			inputmode: this.type === "numeric" ? "numeric" : "text",
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

				setInputSelectionRange(el, 1, 1);

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

				setInputSelectionRange(el, 1, 1);
			},
			oninput: (e: Event) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}
				e.preventDefault();
				const prev = currValue;
				const inputted = prev ? el.value.slice(prev.length) : el.value;
				if (inputted.length === 1) {
					const char = el.value.slice(el.value.length - 1);
					if (!validateInput(char, this.type)) {
						this.#props.onError?.({
							method: "input",
							message: `Input did not match the type ${this.type}`,
						});
						el.value = el.value.slice(0, -1);
						return;
					}
					el.value = char;
					this.#addCharAtIndex(char, index);

					const inputs = this.#getInputEls();
					const currIndex = inputs.indexOf(el);

					// Set timeout so deps can change, and canFocus is re-evaluated.
					setTimeout(() => inputs[currIndex + 1]?.focus());
				} else {
					if (this.#props.onPaste) {
						this.#props.onPaste(inputted);
					} else {
						onpaste(inputted);
					}
				}
			},
			onfocus: () => {
				this.#focusedIndex = index;
			},
			onblur: () => {
				this.#focusedIndex = -1;
			},
			onpaste: (e) => {
				e.preventDefault();
				const pasted = e.clipboardData?.getData("text");
				if (!pasted) return;

				if (this.#props.onPaste) {
					this.#props.onPaste(pasted);
				} else {
					onpaste(pasted);
				}
			},
		} as const satisfies HTMLInputAttributes;
	}
}
