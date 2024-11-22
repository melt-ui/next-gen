export function isMac(): boolean {
	return /mac/i.test(navigator.platform);
}

export function isControlOrMeta(event: KeyboardEvent | MouseEvent): boolean {
	return isMac() ? event.metaKey : event.ctrlKey;
}
