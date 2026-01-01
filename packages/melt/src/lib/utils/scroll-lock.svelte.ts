import { isIOS, isWebKit } from "./platform";

function isOverflowElement(element: HTMLElement): boolean {
	const overflow = getComputedStyle(element).overflow;
	return overflow !== "visible";
}

function hasInsetScrollbars() {
	if (typeof document === "undefined") {
		return false;
	}
	const win = window;
	return win.innerWidth - document.documentElement.clientWidth > 0;
}

function preventScrollOverlayScrollbars() {
	const html = document.documentElement;
	const body = document.body;
	const elementToLock = isOverflowElement(html) ? html : body;
	const originalOverflow = elementToLock.style.overflow;
	elementToLock.style.overflow = "hidden";
	return () => {
		elementToLock.style.overflow = originalOverflow;
	};
}

function preventScrollInsetScrollbars() {
	const html = document.documentElement;
	const body = document.body;
	const win = window;

	let scrollTop = 0;
	let scrollLeft = 0;
	let rafId: number | null = null;

	const supportsStableScrollbarGutter =
		typeof CSS !== "undefined" && CSS.supports?.("scrollbar-gutter", "stable");

	if (isWebKit() && (win.visualViewport?.scale ?? 1) !== 1) {
		return () => {};
	}

	let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
	let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
	let originalHtmlScrollBehavior = "";

	function lockScroll() {
		const htmlStyles = win.getComputedStyle(html);
		const bodyStyles = win.getComputedStyle(body);
		const htmlScrollbarGutterValue = htmlStyles.scrollbarGutter || "";
		const hasBothEdges = htmlScrollbarGutterValue.includes("both-edges");
		const scrollbarGutterValue = hasBothEdges ? "stable both-edges" : "stable";

		scrollTop = html.scrollTop;
		scrollLeft = html.scrollLeft;

		originalHtmlStyles = {
			scrollbarGutter: html.style.scrollbarGutter,
			overflowY: html.style.overflowY,
			overflowX: html.style.overflowX,
		};
		originalHtmlScrollBehavior = html.style.scrollBehavior;

		originalBodyStyles = {
			position: body.style.position,
			height: body.style.height,
			width: body.style.width,
			boxSizing: body.style.boxSizing,
			overflowY: body.style.overflowY,
			overflowX: body.style.overflowX,
			scrollBehavior: body.style.scrollBehavior,
		};

		const isScrollableY = html.scrollHeight > html.clientHeight;
		const isScrollableX = html.scrollWidth > html.clientWidth;
		const hasConstantOverflowY =
			htmlStyles.overflowY === "scroll" || bodyStyles.overflowY === "scroll";
		const hasConstantOverflowX =
			htmlStyles.overflowX === "scroll" || bodyStyles.overflowX === "scroll";

		const scrollbarWidth = Math.max(0, win.innerWidth - html.clientWidth);
		const scrollbarHeight = Math.max(0, win.innerHeight - html.clientHeight);

		const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
		const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);
		const elementToLock = isOverflowElement(html) ? html : body;

		if (supportsStableScrollbarGutter) {
			html.style.scrollbarGutter = scrollbarGutterValue;
			elementToLock.style.overflowY = "hidden";
			elementToLock.style.overflowX = "hidden";
			return;
		}

		Object.assign(html.style, {
			scrollbarGutter: scrollbarGutterValue,
			overflowY: "hidden",
			overflowX: "hidden",
		});

		if (isScrollableY || hasConstantOverflowY) {
			html.style.overflowY = "scroll";
		}
		if (isScrollableX || hasConstantOverflowX) {
			html.style.overflowX = "scroll";
		}

		Object.assign(body.style, {
			position: "relative",
			height:
				marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : "100dvh",
			width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : "100vw",
			boxSizing: "border-box",
			overflow: "hidden",
			scrollBehavior: "unset",
		});

		body.scrollTop = scrollTop;
		body.scrollLeft = scrollLeft;
		html.setAttribute("data-melt-scroll-locked", "");
		html.style.scrollBehavior = "unset";
	}

	function cleanup() {
		Object.assign(html.style, originalHtmlStyles);
		Object.assign(body.style, originalBodyStyles);

		if (!supportsStableScrollbarGutter) {
			html.scrollTop = scrollTop;
			html.scrollLeft = scrollLeft;
			html.removeAttribute("data-melt-scroll-locked");
			html.style.scrollBehavior = originalHtmlScrollBehavior;
		}
	}

	function handleResize() {
		cleanup();
		rafId = requestAnimationFrame(lockScroll);
	}

	lockScroll();
	win.addEventListener("resize", handleResize);

	return () => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}
		cleanup();
		win.removeEventListener("resize", handleResize);
	};
}

class ScrollLocker {
	lockCount = 0;
	restore: (() => void) | null = null;
	timeoutLockId: ReturnType<typeof setTimeout> | null = null;
	timeoutUnlockId: ReturnType<typeof setTimeout> | null = null;

	acquire() {
		this.lockCount += 1;
		if (this.lockCount === 1 && this.restore === null) {
			this.timeoutLockId = setTimeout(() => this.lock(), 0);
		}
		return this.release;
	}

	release = () => {
		this.lockCount -= 1;
		if (this.lockCount === 0 && this.restore) {
			this.timeoutUnlockId = setTimeout(this.unlock, 0);
		}
	};

	private unlock = () => {
		if (this.lockCount === 0 && this.restore) {
			this.restore?.();
			this.restore = null;
		}
	};

	private lock() {
		if (this.lockCount === 0 || this.restore !== null) {
			return;
		}

		const html = document.documentElement;
		const htmlOverflowY = window.getComputedStyle(html).overflowY;

		if (htmlOverflowY === "hidden" || htmlOverflowY === "clip") {
			this.restore = () => {};
			return;
		}

		const hasOverlayScrollbars = isIOS() || !hasInsetScrollbars();

		this.restore = hasOverlayScrollbars
			? preventScrollOverlayScrollbars()
			: preventScrollInsetScrollbars();
	}
}

const SCROLL_LOCKER = new ScrollLocker();

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true): () => void {
	let releaseFn: (() => void) | null = null;

	const cleanup = () => {
		releaseFn?.();
		releaseFn = null;
	};

	$effect(() => {
		if (!enabled) return;

		releaseFn = SCROLL_LOCKER.acquire();
		return cleanup;
	});

	return cleanup;
}
