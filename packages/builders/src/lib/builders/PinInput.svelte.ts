import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
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
};

export class PinInput {
	#value: Synced<string>;
	#id = nanoid();

	constructor(props: PinInputProps = {}) {
		this.#value = new Synced(props.value ?? "", props.onValueChange);
	}


	get value() {
		return this.#value.current;
	}

	set value(value: string) {
		this.#value.current = value;
	}

	#getInputs(): HTMLInputElement[] {
		const rootEl = document.getElementById(this.#id);
		if (!rootEl) return [];
		return [...rootEl.querySelectorAll(`[${identifiers.input}]`)].filter(isHtmlInputElement);
	}

	get root() {
		return {
			[identifiers.root]: "",
			id: this.#id,
		} as const;
	}

	get input() {
		return {
			[identifiers.input]: "",
			onkeydown: (e: KeyboardEvent) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}

				const inputs = this.#getInputs();
				const currIndex = inputs.indexOf(el);

				switch (e.key) {
					case "ArrowLeft": {
						e.preventDefault();
						inputs.at(currIndex - 1)?.focus();
						break;
					}
					case "ArrowRight": {
						e.preventDefault();
						inputs.at((currIndex + 1) % inputs.length)?.focus();
						break;
					}
				}
			},
			oninput: (e: InputEvent) => {
				const el = e.target;
				if (!isHtmlInputElement(el)) {
					return;
				}

				const inputs = this.#getInputs();
				const currIndex = inputs.indexOf(el);

				this.#value.current = inputs.map((input) => input.value).join("");
				inputs.at(currIndex + 1)?.focus();
			},
		} as const;
	}
}
