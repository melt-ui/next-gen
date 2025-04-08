import { tick } from "svelte";
import { addEventListener } from "./event";
import { isHtmlElement } from "./is";

/**
 * For some god-forsaken stupid reason, hidePopover throws an error
 * if the element is already hidden, and then breaks the entire app.
 * This avoids that.
 */
export function safelyHidePopover(el: HTMLElement) {
	try {
		el.hidePopover();
	} catch {
		// do nothing as god intended
	}
}

/**
 * showPopover is equally stupid.
 */
export function safelyShowPopover(el: HTMLElement) {
	try {
		el.showPopover();
	} catch {
		// do nothing as god intended
	}
}

export function* getParentPopoversAndDialogs(
	element: HTMLElement,
): Generator<HTMLElement | HTMLDialogElement> {
	let current: HTMLElement | null = element;

	while (current) {
		// Check if current element is a dialog or has a popover
		if (current instanceof HTMLDialogElement || current.hasAttribute("popover")) {
			yield current;
		}

		// Move up the DOM tree using closest() with a parent selector
		current = current.closest(":scope > *, :host > *")?.parentElement ?? null;
	}
}

export function areAllParentPopoversAndDialogsOpen(element: HTMLElement): boolean {
	for (const parent of getParentPopoversAndDialogs(element)) {
		if (parent instanceof HTMLDialogElement) {
			if (!parent.open) return false;
		} else if (!parent.matches(":popover-open")) {
			return false;
		}
	}
	return true;
}

export function isDialogOrPopoverOpen(element: HTMLElement): boolean {
	return element instanceof HTMLDialogElement ? element.open : element.matches(":popover-open");
}

type AutoOpenPopoverArgs = {
	el: HTMLElement;
};

export function autoOpenPopover({ el }: AutoOpenPopoverArgs) {
	const events: Array<() => void> = [];

	// Check if there's a parent popover or dialog. If so, only open if the parent's open.
	// This is to guarantee correct layering.
	const parent = isHtmlElement(el.parentNode)
		? el.parentNode.closest("dialog, [popover]")
		: undefined;

	if (!isHtmlElement(parent)) {
		safelyShowPopover(el);
		return;
	}

	tick().then(() => {
		// No return here, because we still wanna close it when the parents close
		if (isDialogOrPopoverOpen(parent)) {
			safelyShowPopover(el);
		}

		if (parent instanceof HTMLDialogElement) {
			events.push(
				addEventListener(parent, "close", () => {
					safelyHidePopover(el);
				}),
				addEventListener(parent, "open", () => {
					safelyShowPopover(el);
				}),
			);
		} else {
			events.push(
				addEventListener(parent, "toggle", async (e) => {
					await new Promise((r) => setTimeout(r));

					const isOpen = e.newState === "open";
					if (isOpen) {
						safelyShowPopover(el);
					} else {
						safelyHidePopover(el);
					}
				}),
			);
		}
	});

	return () => {
		events.forEach((e) => e());
	};
}
