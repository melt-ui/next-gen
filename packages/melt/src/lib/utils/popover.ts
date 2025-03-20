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
