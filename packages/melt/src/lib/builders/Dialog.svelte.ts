import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { useScrollLock } from "$lib/utils/scroll-lock.svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import type { HTMLDialogAttributes } from "svelte/elements";
import { on } from "svelte/events";

const { dataAttrs, createReferences } = createBuilderMetadata("dialog", ["trigger", "content"]);

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
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	closeOnEscape = $derived(extract(this.#props.closeOnEscape, true));
	closeOnOutsideClick = $derived(extract(this.#props.closeOnOutsideClick, true));
	scrollLock = $derived(extract(this.#props.scrollLock, true));

	/* State */
	refs = createReferences();
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
			onclick: () => (this.open = !this.open),
			...this.sharedProps,
		} as const;
	}

	#ak = createAttachmentKey();
	#contentAttachment: Attachment<HTMLDialogElement> = (node) => {
		$effect(() => {
			const releaseScrollLock = useScrollLock(this.scrollLock && this.open, node);
			return releaseScrollLock;
		});

		$effect(() => {
			if (this.open && !node.open) {
				node.showModal();
			} else if (!this.open && node.open) {
				node.close();
			}
		});

		const offs = [
			on(document, "keydown", (e) => {
				if (!this.closeOnEscape) return;
				const el = this.refs.get("content");
				if (e.key !== "Escape" || !this.open || !isHtmlElement(el)) return;
				e.preventDefault();

				// Set timeout to give time to all event listeners to run
				setTimeout(() => (this.open = false));
			}),

			on(node, "click", (e) => {
				if (!this.open || !this.closeOnOutsideClick) return; // Exit early if not open

				// Don't close if text is selected
				if (window.getSelection()?.toString()) return;

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
}
