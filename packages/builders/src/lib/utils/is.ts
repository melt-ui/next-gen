export function isHtmlElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement;
}

export function isFunction(value: unknown): value is Function {
	return typeof value === "function";
}
