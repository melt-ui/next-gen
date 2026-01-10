import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata, createId } from "$lib/utils/identifiers";
import { isFunction, isHtmlElement } from "$lib/utils/is";
import { autoOpenPopover, safelyHidePopover } from "$lib/utils/popover";
import {
	useFloating,
	type UseFloatingArgs,
	type UseFloatingConfig,
} from "$lib/utils/use-floating.svelte";
import { size, type ElementRects } from "@floating-ui/dom";
import { dequal } from "dequal";
import { watch } from "runed";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";
import { on } from "svelte/events";
import * as focusTrap from "focus-trap"; // ESM
import { untrack } from "svelte";

const { dataAttrs, dataSelectors } = createBuilderMetadata("popover", [
	"trigger",
	"content",
	"arrow",
]);

export type CloseOnOutsideClickCheck = (el: Element | Window | Document) => boolean;
type CloseOnOutsideClickProp = MaybeGetter<boolean | CloseOnOutsideClickCheck | undefined>;

export const isCloseOnOutsideClickCheck = (
	value: CloseOnOutsideClickProp,
): value is CloseOnOutsideClickCheck => isFunction(value) && value.length === 1;

function getHtmlElement(el: string | HTMLElement): HTMLElement | undefined {
	const elm = typeof el === "string" ? document.querySelector(el) : el;
	if (!isHtmlElement(elm)) return undefined;
	return elm;
}

export type PopoverProps = {
	/**
	 * If the Popover is open.
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
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * Config to be passed to `useFloating`
	 */
	floatingConfig?: UseFloatingArgs["config"];

	/**
	 * If the popover should have the same width as the trigger
	 *
	 * @default false
	 */
	sameWidth?: MaybeGetter<boolean | undefined>;

	/**
	 * If the popover should close when clicking escape.
	 *
	 * @default true
	 */
	closeOnEscape?: MaybeGetter<boolean | undefined>;

	/**
	 * If the popover should close when clicking outside.
	 * Alternatively, accepts a function that receives the clicked element,
	 * and returns if the popover should close.
	 *
	 * @default true
	 */
	closeOnOutsideClick?: CloseOnOutsideClickProp;

	focus?: {
		/**
		 * Which element to focus when the popover opens.
		 * Can be a selector string, an element, or a Getter for those.
		 * If null, the focus remains on the trigger element.
		 *
		 * Defaults to the popover content element.
		 */
		onOpen?: MaybeGetter<HTMLElement | string | null | undefined>;

		/**
		 * Which element to focus when the popover closes.
		 * Can be a selector string, an element, or a Getter for those.
		 * If null, the focus goes to the document body.
		 *
		 * Defaults to the last used trigger element.
		 */
		onClose?: MaybeGetter<HTMLElement | string | null | undefined>;

		/**
		 * If focus should be trapped inside the popover content when open.
		 *
		 * @default false
		 */
		trap?: MaybeGetter<boolean | undefined>;
	};
	
	/**
	 * The ids to use for the popover elements.
	 */
	ids?: MaybeGetter<Partial<BasePopover["ids"]> | undefined>;
};

export class BasePopover {
	/* Props */
	#props!: PopoverProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	closeOnEscape = $derived(extract(this.#props.closeOnEscape, true));
	sameWidth = $derived(extract(this.#props.sameWidth, false));
	closeOnOutsideClick = $derived(extract(this.#props.closeOnOutsideClick, true));
	floatingConfig = $derived.by(() => {
		const config = extract(this.#props.floatingConfig, {} satisfies UseFloatingConfig);

		const sameWidth = extract(this.#props.sameWidth);
		if (sameWidth !== undefined) {
			config.sameWidth = sameWidth;
		}

		config.computePosition = {
			...config.computePosition,
			middleware: [
				...(config.computePosition?.middleware ?? []),
				size({
					apply: ({ availableWidth, availableHeight }) => {
						this.availableWidth = availableWidth;
						this.availableHeight = availableHeight;
					},
				}),
				{
					name: "grabInvokerRect",
					fn: ({ rects }) => {
						const prev = $state.snapshot(this.invokerRect);
						const curr = rects.reference;
						if (dequal(prev, curr)) return {};
						this.invokerRect = rects.reference;
						return {};
					},
				},
			],
		};

		return config;
	});

	focus = $derived.by(() => ({
		onOpen: extract(this.#props.focus?.onOpen, `#${this.ids.popover}`),
		onClose: extract(this.#props.focus?.onClose, this.triggerEl),
		trap: extract(this.#props.focus?.trap, false),
	}));

	/* State */
	invokerRect = $state<ElementRects["reference"]>();
	availableWidth = $state<number>();
	availableHeight = $state<number>();
	triggerEl: HTMLElement | null = $state(null);
	#open!: Synced<boolean>;
	ids = $state({ popover: createId() });

	constructor(props: PopoverProps = {}) {
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
		this.#props = props;
		this.ids = {
			...this.ids,
			...extract(props.ids, {})
		}
	}

	get open() {
		return this.#open.current;
	}

	set open(value) {
		this.#open.current = value;
	}

	#shouldClose(el: Node) {
		if (this.closeOnOutsideClick === false) return false;

		if (isFunction(this.closeOnOutsideClick)) {
			return isCloseOnOutsideClickCheck(this.closeOnOutsideClick)
				? this.closeOnOutsideClick(el as HTMLElement) // Pass target if it's the correct type
				: this.closeOnOutsideClick(); // Otherwise, call without arguments
		}

		return true;
	}

	protected get sharedProps() {
		// Track the last focused element before any potential deletion
		let lastFocusedElement: Element | null = null;

		return {
			onfocus: (event: FocusEvent) => {
				// Update our tracked element whenever focus happens
				lastFocusedElement = event.target as Element;
			},

			onfocusout: async (event: FocusEvent) => {
				if (!this.triggerEl) return;
				await new Promise((r) => setTimeout(r, 0));

				const contentEl = document.getElementById(this.ids.popover);
				const relatedTarget = event.relatedTarget as Element | null;

				// Use the related target from the event when possible
				const newFocusElement = relatedTarget || document.activeElement;

				// If we can't determine where focus went, use our tracked element
				const targetElement =
					newFocusElement === document.body ? lastFocusedElement : newFocusElement;

				if (
					!targetElement ||
					contentEl?.contains(targetElement) ||
					this.triggerEl?.contains(targetElement) ||
					!this.#shouldClose(targetElement)
				) {
					return;
				}

				this.open = false;
			},
			style: styleAttr({
				"--melt-invoker-width": `${this.invokerRect?.width ?? 0}px`,
				"--melt-invoker-height": `${this.invokerRect?.height ?? 0}px`,
				"--melt-invoker-x": `${this.invokerRect?.x ?? 0}px`,
				"--melt-invoker-y": `${this.invokerRect?.y ?? 0}px`,
				"--melt-popover-available-width": `${this.availableWidth ?? 0}px`,
				"--melt-popover-available-height": `${this.availableHeight ?? 0}px`,
			}),
		} satisfies HTMLAttributes<HTMLElement>;
	}

	#triggerAttachmentKey = createAttachmentKey();
	#triggerAttachment: Attachment<HTMLElement> = (node) => {
		if (untrack(() => this.triggerEl)) return;

		this.triggerEl = node;
		return () => {
			if (this.triggerEl !== node) return;
			this.triggerEl = null;
		};
	};

	/** The trigger that toggles the value. */
	protected getInvoker() {
		return {
			// @ts-expect-error - we're a bit more permissive here
			popovertarget: this.ids.popover,
			onclick: (e: Event) => {
				e.preventDefault();
				this.triggerEl = e.currentTarget as HTMLElement;
				this.open = !this.open;
			},
			...this.sharedProps,
			[this.#triggerAttachmentKey]: this.#triggerAttachment,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	#popoverAttachmentKey = createAttachmentKey();
	#popoverAttachment: Attachment<HTMLElement> = (node) => {
		// Show and hide popover based on open state
		const isVisible = $derived(this.open || this.forceVisible);
		$effect(() => {
			const el = document.getElementById(this.ids.popover);
			if (!isHtmlElement(el)) {
				return;
			}

			if (isVisible) {
				return autoOpenPopover({ el });
			} else {
				safelyHidePopover(el);
			}
		});

		watch(
			() => this.open,
			(open) => {
				setTimeout(() => {
					const selector = open ? this.focus.onOpen : this.focus.onClose;
					if (!selector) return;
					const el = getHtmlElement(selector);
					el?.focus();
				});
			},
			{ lazy: true },
		);

		const trap = focusTrap.createFocusTrap(node, {
			allowOutsideClick: true,
			clickOutsideDeactivates: true,
		});
		$effect(() => {
			if (!this.open || !this.focus.trap) return;
			trap.activate();

			return () => trap.deactivate();
		});

		$effect(() => {
			const contentEl = document.getElementById(this.ids.popover);
			const triggerEl = this.triggerEl;
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl) || !this.open) {
				return;
			}

			useFloating({
				node: () => triggerEl,
				floating: () => contentEl,
				config: () => this.floatingConfig,
			});
		});

		const offs = [
			on(document, "keydown", (e) => {
				if (!this.closeOnEscape) return;
				const el = document.getElementById(this.ids.popover);
				if (e.key !== "Escape" || !this.open || !isHtmlElement(el)) return;
				e.preventDefault();
				const openPopovers = [...el.querySelectorAll("[popover]")].filter((child) => {
					if (!isHtmlElement(child)) return false;
					// If child is a Melt popover, check if it's open
					if (child.matches(dataSelectors.content)) return child.dataset.open !== undefined;
					return child.matches(":popover-open");
				});

				if (openPopovers.length) return;
				// Set timeout to give time to all event listeners to run
				setTimeout(() => (this.open = false));
			}),

			on(document, "click", (e) => {
				if (!this.open) return; // Exit early if not open

				const contentEl = document.getElementById(this.ids.popover);
				const triggerEl = this.triggerEl;

				if (!contentEl || !triggerEl) return; // Exit if elements are missing

				const target = e.target as Node;
				const isInsideContent = contentEl.contains(target);
				const isInsideTrigger = triggerEl.contains(target);

				if (isInsideContent || isInsideTrigger) return; // Exit if clicked inside

				if (this.#shouldClose(target)) this.open = false;
			}),
		];

		return () => offs.forEach((off) => off());
	};

	protected getPopover() {
		return {
			id: this.ids.popover,
			popover: "manual",
			ontoggle: (e) => {
				const newOpen = e.newState === "open";
				if (this.open !== newOpen && newOpen === false) {
					this.open = newOpen;
				}
			},
			// Needed so it receives focus on click, but not on tab, because of focus out
			tabindex: -1,
			inert: !this.open,
			"data-open": dataAttr(this.open),
			[this.#popoverAttachmentKey]: this.#popoverAttachment,
			...this.sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get arrow() {
		return {
			[dataAttrs.arrow]: "",
			"data-arrow": "",
			"aria-hidden": true,
			"data-open": dataAttr(this.open),
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}

export class Popover extends BasePopover {
	declare ids: BasePopover["ids"] & {
		trigger: string;
		content: string;
	};

	constructor(props: PopoverProps = {}) {
		super({ ...props });
		this.ids = { ...this.ids, content: this.ids.popover };
	}

	/** The trigger that toggles the value. */
	get trigger() {
		return Object.assign(this.getInvoker(), {
			[dataAttrs.trigger]: "",
		});
	}

	get content() {
		return Object.assign(this.getPopover(), {
			[dataAttrs.content]: "",
		});
	}

	// IDEA: separate content and floating ui to achieve transitions without requiring
	// force visible or custom esc and click outside handlers!
}
