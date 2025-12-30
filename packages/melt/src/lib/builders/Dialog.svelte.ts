import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import type { CloseOnOutsideClickProp } from "$lib/utils/close-on-outside-click";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { watch } from "runed";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import type { HTMLDialogAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("dialog", [
	"trigger",
	"content",
]);

export type DialogProps = {
	/**
	 * If the Dialog is open.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the value is supposed to change.
	 */
	onOpenChange?: (value: boolean) => void;

	/**
	 * If the dialog visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * If the dialog should close when clicking escape.
	 *
	 * @default true
	 */
	closeOnEscape?: MaybeGetter<boolean | undefined>;

	/**
	 * If the dialog should close when clicking outside.
	 * Alternatively, accepts a function that receives the clicked element,
	 * and returns if the dialog should close.
	 *
	 * @default true
	 */
	closeOnOutsideClick?: CloseOnOutsideClickProp;

	focus?: {
		/**
		 * Which element to focus when the dialog opens.
		 * Can be a selector string, an element, or a Getter for those.
		 * If null, the focus remains on the trigger element.
		 *
		 * Defaults to the dialog content element.
		 */
		onOpen?: MaybeGetter<HTMLElement | string | null | undefined>;

		/**
		 * Which element to focus when the dialog closes.
		 * Can be a selector string, an element, or a Getter for those.
		 * If null, the focus goes to the document body.
		 *
		 * Defaults to the last used trigger element.
		 */
		onClose?: MaybeGetter<HTMLElement | string | null | undefined>;
	};
};

export class Dialog {
	/* Props */
	#props!: DialogProps;

	/* State */
	#open!: Synced<boolean>;
	// prettier-ignore
	get open() { return this.#open.current }
	// prettier-ignore
	set open(v) { this.#open.current = v }

	constructor(props: DialogProps = {}) {
		this.#props = props;
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	/** The trigger element. */
	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			onclick: () => (this.open = !this.open),
		} as const;
	}

	#ak = createAttachmentKey();
	#contentAttachment: Attachment<HTMLDialogElement> = (node) => {
		$effect(() => {
			if (this.open && !node.open) node.showModal();
			else if (!this.open && node.open) node.close();
		});
	};

	/** The element for the dialog itself. */
	get content() {
		return {
			[dataAttrs.content]: "",
			[this.#ak]: this.#contentAttachment,
		} as const satisfies HTMLDialogAttributes;
	}
}

