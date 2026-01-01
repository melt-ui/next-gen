export function isMac(): boolean {
	return /mac/i.test(navigator.platform);
}

export function isControlOrMeta(event: KeyboardEvent | MouseEvent): boolean {
	return isMac() ? event.metaKey : event.ctrlKey;
}

export function isIOS() {
	if (typeof window === "undefined") return false;
	const nav = window.navigator;
	const platform = nav.platform ?? "";
	const maxTouchPoints = nav.maxTouchPoints ?? -1;

	// iPads can claim to be MacIntel
	if (platform === "MacIntel" && maxTouchPoints > 1) {
		return true;
	}
	return /iP(hone|ad|od)|iOS/.test(platform);
}

export function isWebKit() {
	if (typeof window === "undefined" || typeof CSS === "undefined") return false;
	return CSS.supports?.("-webkit-backdrop-filter", "none") ?? false;
}
