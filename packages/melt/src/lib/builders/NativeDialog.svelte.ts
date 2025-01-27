import { Synced } from "$lib/Synced.svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLDialogAttributes } from "svelte/elements";
import { createBuilderMetadata } from "../utils/identifiers";
import type { MaybeGetter } from "$lib/types";
import { extract } from "$lib/utils/extract";

const metadata = createBuilderMetadata("dialog", [
	"root",
	"overlay",
	"content",
	"trigger",
	"close",
	"title",
	"description",
]);

export type NativeDialogProps = {
	/**
	 * If the dialog is open.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean>;
	/**
	 * Called when the dialog state changes.
	 *
	 * @param value New state of the dialog.
	 * @param e Triggering event.
	 */
	onOpenChange?: (value: boolean, e?: Event) => void;
	/**
	 * Called before opening or closing the dialog.
	 *
	 * @param value New attempted state of the dialog.
	 * @param e Triggering event.
	 *
	 * @returns Truthy to proceed, else will prevent the expected state change.
	 */
	beforeOpenChange?: (value: boolean, e?: Event) => boolean;
	/**
	 * Show the dialog using `showModal` instead of `show`.
	 *
	 * @default true
	 */
	modal?: MaybeGetter<boolean>;
	/**
	 * Close the dialog whenever a user clicks outside.
	 *
	 * @default true
	 */
	lightDismiss?: MaybeGetter<boolean>;
	/**
	 * If the dialog visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean>;
	/**
	 * Disable scrolling on dialog's containing element or on a specific element.
	 *
	 * @default true
	 */
	preventScroll?: MaybeGetter<boolean | HTMLElement>;
};

export class NativeDialog {
	#ids = metadata.createIds();

	/* Props */
	#props!: NativeDialogProps;

	/* State */
	#open: Synced<boolean>;
	readonly modal = $derived(extract(this.#props.modal, true));
	readonly forceVisible = $derived(extract(this.#props.forceVisible, false));
	readonly lightDismiss = $derived(extract(this.#props.lightDismiss, true));
	readonly preventScroll = $derived(extract(this.#props.preventScroll, true));

	constructor(props: NativeDialogProps = {}) {
		this.#props = props;
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	get open() {
		return this.#open.current;
	}

	set open(value: boolean) {
		this.#setOpen(value);
	}

	#setOpen(value: boolean, e?: Event) {
		if (this.open === value) return;

		const stop = this.#props.beforeOpenChange ? !this.#props.beforeOpenChange(value, e) : false;
		if (stop) {
			if (e && !e?.defaultPrevented) e.preventDefault();
			return false;
		}

		// to do: save previous activeElement ref for focus restoration later.
		// if (value && document.activeElement instanceof HTMLElement) {
		//   this.#prevFocusRef = document.activeElement;
		//   this.#prevFocusVisible = this.#prevFocusRef?.matches(':focus-visible') ?? false;
		// }

		this.#open.current = value;

		if (!value && !this.forceVisible) {
			const el = document.getElementById(this.#ids.root);
      if (el instanceof HTMLDialogElement) {
				// to do: figure out how to handle/pass returnValue
        el.close()
      }
		}

		// to do: implement scroll locking util.
		// if (this.#props.preventScroll) {
		//   this.#scrollLock.active = open;
		// }

		// to do: restore focus.
		// if (!this.#open.current) {
		// 	if (this.#prevFocusRef) {
		// 		this.#prevFocusRef.focus(
		// 			// @ts-expect-error: experimental with poor support (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
		// 			{ focusVisible: this.#prevFocusVisible },
		// 		);
		// 	}
		// 	this.#prevFocusRef = undefined;
		// 	this.#prevFocusVisible = false;
		// }

		this.#props.onOpenChange?.(value, e);
		return true;
	}

	get #sharedAttrs() {
		return { "data-state": this.open ? "open" : "closed" };
	}

	get root() {
		$effect(() => {
      const el = document.getElementById(this.#ids.root);
      if (!(el instanceof HTMLDialogElement)) {
        return;
      }
			if (this.open || this.forceVisible) {
				if (this.modal) {
					el.showModal();
				} else {
					el.show();
				}
			}
    });
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.root]: "",
			id: this.#ids.root,
			onclick: (e) => {
				const contentEl = document.getElementById(this.#ids.content);
        if (this.lightDismiss) {
					if (e.target instanceof Node && contentEl?.contains(e.target)) {
						return;
					}
          this.#setOpen(false, e);
        }
      },
      oncancel: (e) => {
        e.preventDefault();
        if (this.lightDismiss) {
          this.#setOpen(false, e);
        }
      },
		} as const satisfies HTMLDialogAttributes;
	}

	get overlay() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.overlay]: "",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get content() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.content]: "",
			id: this.#ids.content,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	getTrigger({
		mode = "toggle",
	}: {
		/**
		 * The logic used to determine the triggered state.
		 */
		mode?: "toggle" | "open" | "close";
	} = {}) {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.trigger]: "",
			"aria-haspopup": "dialog" as const,
			onclick: (e) => {
				const open = mode === "open" ? true : mode === "close" ? false : !this.open;
				this.#setOpen(open, e);
			},
		} as const satisfies HTMLButtonAttributes;
	}

	get close() {
		return {
			[metadata.dataAttrs.close]: "",
			onclick: (e) => {
				this.#setOpen(false, e);
			},
		} as const satisfies HTMLButtonAttributes;
	}

	get title() {
		return {
			[metadata.dataAttrs.title]: "",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get description() {
		return {
			[metadata.dataAttrs.description]: "",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}
