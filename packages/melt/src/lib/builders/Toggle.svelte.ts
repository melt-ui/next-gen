import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { createPreventable } from "$lib/utils/event";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { tick } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import { on } from "svelte/events";

const identifiers = createDataIds("toggle", ["trigger", "hidden-input"]);

export type ToggleProps = {
	/**
	 * The value for the Toggle.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	value?: MaybeGetter<boolean>;
	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: (value: boolean) => void;

	/**
	 * If `true`, prevents the user from interacting with the input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Toggle {
	/* Props */
	#props!: ToggleProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));

	/* State */
	#value!: Synced<boolean>;

	constructor(props: ToggleProps = {}) {
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: false,
		});
		this.#props = props;
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	/** The trigger that toggles the value. */
	trigger = $derived.by(() => {
		const onclick = createPreventable(() => {
			if (this.disabled) return;
			this.value = !this.value;
		});

		const attachment: Attachment = (node) => {
			return on(node, "click", onclick);
		};

		const obj = {
			[identifiers.trigger]: "",
			"data-checked": dataAttr(this.value),
			"aria-pressed": this.value,
			disabled: disabledAttr(this.disabled),
			[createAttachmentKey()]: attachment,
		} as const;

		Object.defineProperties(obj, {
			onclick: {
				value: onclick,
				enumerable: false,
			},
		});

		return obj as typeof obj & { onclick: typeof onclick };
	});

	/** A hidden input field to use within forms. */
	get hiddenInput() {
		return {
			[identifiers["hidden-input"]]: "",
			type: "hidden",
			value: this.value ? "on" : "off",
		} as const;
	}
}
