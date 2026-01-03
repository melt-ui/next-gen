import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { useScrollLock } from "$lib/utils/scroll-lock.svelte";
import { tick } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import type { HTMLAttributes, HTMLDialogAttributes } from "svelte/elements";
import { on } from "svelte/events";

const { dataAttrs, createReferences } = createBuilderMetadata("dialog", [
	"trigger",
	"content",
	"overlay",
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
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the value is supposed to change.
	 */
	onOpenChange?: (value: boolean) => void;

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
	closeOnOutsideClick?: MaybeGetter<boolean | undefined>;

	/**
	 * If the dialog should lock the document scroll when open.
	 *
	 * @default true
	 */
	scrollLock?: MaybeGetter<boolean | undefined>;
};

export class Dialog {
	/* Props */
	#props!: DialogProps;
	closeOnEscape = $derived(extract(this.#props.closeOnEscape, true));
	closeOnOutsideClick = $derived(extract(this.#props.closeOnOutsideClick, true));
	scrollLock = $derived(extract(this.#props.scrollLock, true));
	#ak = createAttachmentKey();

	constructor(props: DialogProps = {}) {
		this.#props = props;
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	/* State */
	refs = createReferences();
	#open!: Synced<boolean>;

	// prettier-ignore
	get open() { return this.#open.current }
	set open(v) {
		const el = this.refs.get("content");
		const overlay = this.refs.get("overlay");

		// Shouldn't happen, but...
		if (!(el instanceof HTMLDialogElement)) {
			this.#open.current = v;
			return;
		}
		const styles = getComputedStyle(el);
		const hasTransition =
			styles.transitionDuration !== "0s" && parseFloat(styles.transitionDuration) > 0;

		if (v) {
			overlay?.showPopover();
			el.showModal();
			// to allow for transitions to happen
			tick().then(() => (this.#open.current = v));
		} else {
			this.#open.current = v;
			// if there is a transition, transitionend will deal with it
			if (!hasTransition) {
				el.close();
				overlay?.hidePopover();
			}
		}
	}

	get sharedProps() {
		return {
			"data-open": dataAttr(this.open),
		};
	}

	/** The trigger element. */
	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			[this.refs.key]: this.refs.attach("trigger"),
			onclick: () => {
				this.open = !this.open;
			},
			type: "button",
			...this.sharedProps,
		} as const;
	}

	#contentAttachment: Attachment<HTMLDialogElement> = (node) => {
		useScrollLock(this.scrollLock && this.open);

		let prevSel = window.getSelection()?.toString();
		const offs = [
			on(node, "transitionend", () => {
				if (!this.open) {
					node.close();
					this.refs.get("overlay")?.hidePopover();
				}
			}),
			on(node, "cancel", (e) => {
				e.preventDefault();
				if (!this.closeOnEscape) return;
				this.open = false;
			}),

			on(node, "pointerdown", () => {
				prevSel = window.getSelection()?.toString();
			}),

			on(document, "pointerup", (e) => {
				if (!this.open || !this.closeOnOutsideClick) return; // Exit early if not open

				const currSel = window.getSelection()?.toString();
				const hasNewSel = (currSel?.length ?? 0) > 0 && currSel !== prevSel;

				// Don't close if text is selected
				if (hasNewSel) return;

				const hasChildDialogsOpen = node.querySelector("dialog[open]");
				if (hasChildDialogsOpen) return;

				// check if click was on backdrop
				const rect = node.getBoundingClientRect();
				const isInDialog =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;

				if (isInDialog) return;

				this.open = false;
			}),
		];

		return () => offs.forEach((off) => off());
	};

	/** The element for the dialog itself. */
	get content() {
		return {
			[dataAttrs.content]: "",
			[this.#ak]: this.#contentAttachment,
			onclose: () => {
				this.open = false;
			},
			[this.refs.key]: this.refs.attach("content"),
			...this.sharedProps,
		} as const satisfies HTMLDialogAttributes;
	}

	/** Optional overlay element, to replace dialog::backdrop for animation support */
	get overlay() {
		return {
			[dataAttrs.overlay]: "",
			popover: "manual",
			"aria-hidden": true,
			[this.refs.key]: this.refs.attach("overlay"),
			...this.sharedProps,
		} as const satisfies HTMLAttributes<any>;
	}
}
