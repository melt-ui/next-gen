import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { kbd } from "$lib/utils/keyboard";
import { dequal } from "dequal";
import { createAttachmentKey } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("spatial-menu", [
	"root",
	"input",
	"item",
]);

export type SpatialMenuProps<T> = {
	/**
	 * The currently highlighted value.
	 */
	highlighted?: MaybeGetter<T | null | undefined>;

	/**
	 * Called when the highlighted value changes.
	 */
	onHighlightChange?: (highlighted: T | null) => void;

	onSelect?: (value: T) => void;
};

export class SpatialMenu<T> {
	/* Props */
	#props!: SpatialMenuProps<T>;
	onSelect = $derived(this.#props.onSelect);

	/* State */
	#elMap: {
		root?: HTMLElement;
		input?: HTMLInputElement;
	} = {};
	#items: Array<SpatialMenuItem<T>> = [];

	#highlighted: Synced<T | null>;
	get highlighted() {
		return this.#highlighted.current;
	}
	set highlighted(v) {
		this.#highlighted.current = v;
	}

	constructor(props: SpatialMenuProps<T> = {}) {
		this.#props = props;

		this.#highlighted = new Synced({
			value: props.highlighted,
			onChange: props.onHighlightChange,
			defaultValue: null,
		});
	}

	#findClosestItem(direction: "up" | "down" | "left" | "right"): SpatialMenuItem<T> | null {
		const current = this.#items.find((i) => i.highlighted);
		if (!current?.rect) return null;

		const currentRect = current.rect;
		const candidates = this.#items.filter((item) => item !== current && item.rect);

		if (candidates.length === 0) return null;

		let bestCandidate: SpatialMenuItem<T> | null = null;
		let bestScore = Infinity;

		for (const candidate of candidates) {
			const candidateRect = candidate.rect!;
			let isValidDirection = false;
			let distance = 0;

			switch (direction) {
				case "up":
					isValidDirection = candidateRect.bottom <= currentRect.top;
					if (isValidDirection) {
						const verticalDistance = currentRect.top - candidateRect.bottom;
						const horizontalOverlap = Math.max(
							0,
							Math.min(currentRect.right, candidateRect.right) -
								Math.max(currentRect.left, candidateRect.left),
						);
						const horizontalDistance =
							horizontalOverlap > 0
								? 0
								: Math.min(
										Math.abs(currentRect.left - candidateRect.right),
										Math.abs(currentRect.right - candidateRect.left),
									);
						distance = verticalDistance + horizontalDistance * 2;
					}
					break;
				case "down":
					isValidDirection = candidateRect.top >= currentRect.bottom;
					if (isValidDirection) {
						const verticalDistance = candidateRect.top - currentRect.bottom;
						const horizontalOverlap = Math.max(
							0,
							Math.min(currentRect.right, candidateRect.right) -
								Math.max(currentRect.left, candidateRect.left),
						);
						const horizontalDistance =
							horizontalOverlap > 0
								? 0
								: Math.min(
										Math.abs(currentRect.left - candidateRect.right),
										Math.abs(currentRect.right - candidateRect.left),
									);
						distance = verticalDistance + horizontalDistance * 2;
					}
					break;
				case "left":
					isValidDirection = candidateRect.right <= currentRect.left;
					if (isValidDirection) {
						const horizontalDistance = currentRect.left - candidateRect.right;
						const verticalOverlap = Math.max(
							0,
							Math.min(currentRect.bottom, candidateRect.bottom) -
								Math.max(currentRect.top, candidateRect.top),
						);
						const verticalDistance =
							verticalOverlap > 0
								? 0
								: Math.min(
										Math.abs(currentRect.top - candidateRect.bottom),
										Math.abs(currentRect.bottom - candidateRect.top),
									);
						distance = horizontalDistance + verticalDistance * 2;
					}
					break;
				case "right":
					isValidDirection = candidateRect.left >= currentRect.right;
					if (isValidDirection) {
						const horizontalDistance = candidateRect.left - currentRect.right;
						const verticalOverlap = Math.max(
							0,
							Math.min(currentRect.bottom, candidateRect.bottom) -
								Math.max(currentRect.top, candidateRect.top),
						);
						const verticalDistance =
							verticalOverlap > 0
								? 0
								: Math.min(
										Math.abs(currentRect.top - candidateRect.bottom),
										Math.abs(currentRect.bottom - candidateRect.top),
									);
						distance = horizontalDistance + verticalDistance * 2;
					}
					break;
			}

			if (isValidDirection && distance < bestScore) {
				bestScore = distance;
				bestCandidate = candidate;
			}
		}

		return bestCandidate;
	}

	#onKeydown = (e: KeyboardEvent) => {
		const arrowKeys = [kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.ARROW_LEFT, kbd.ARROW_RIGHT] as string[];

		if (arrowKeys.includes(e.key)) {
			e.preventDefault();

			const current = this.#items.find((i) => i.highlighted);
			if (!current) {
				this.highlighted = this.#items[0]?.value ?? null;
				return;
			}

			let nextItem: SpatialMenuItem<T> | null = null;

			switch (e.key) {
				case kbd.ARROW_UP:
					nextItem = this.#findClosestItem("up");
					break;
				case kbd.ARROW_DOWN:
					nextItem = this.#findClosestItem("down");
					break;
				case kbd.ARROW_LEFT:
					nextItem = this.#findClosestItem("left");
					break;
				case kbd.ARROW_RIGHT:
					nextItem = this.#findClosestItem("right");
					break;
			}

			if (nextItem) {
				this.highlighted = nextItem.value;
			}
		}
	};

	/** The root element. */
	get root() {
		return {
			[dataAttrs.root]: "",
			// TODO: check if this is okay in a11y context
			tabindex: 0,
			onkeydown: this.#onKeydown,
			[createAttachmentKey()]: (node) => {
				this.#elMap.root = node;
				return () => {
					delete this.#elMap.root;
				};
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get input() {
		return {
			[dataAttrs.input]: "",
			onkeydown: this.#onKeydown,
			[createAttachmentKey()]: (node) => {
				this.#elMap.input = node;
				return () => {
					delete this.#elMap.input;
				};
			},
		} as const satisfies HTMLAttributes<HTMLInputElement>;
	}

	getItem(value: T, options?: Omit<SpatialMenuItemProps<T>, "parent" | "value">) {
		const item = new SpatialMenuItem({
			value,
			onSelect: options?.onSelect,
			parent: this,
			lifecycle: {
				onMount: () => {
					this.#items.push(item);
				},
				onUnmount: () => {
					this.#items = this.#items.filter((i) => i !== item);
				},
			},
		});

		return item;
	}
}

type SpatialMenuItemProps<T> = {
	value: T;
	onSelect?: () => void;
	parent: SpatialMenu<T>;
	lifecycle: {
		onMount: () => void;
		onUnmount: () => void;
	};
};

class SpatialMenuItem<T> {
	#props!: SpatialMenuItemProps<T>;
	value = $derived(this.#props.value);

	el: HTMLElement | null = null;
	parent = $derived(this.#props.parent);
	highlighted = $derived(dequal(this.parent.highlighted, this.#props.value));

	constructor(props: SpatialMenuItemProps<T>) {
		this.#props = props;
	}

	get attrs() {
		return {
			[dataAttrs.item]: "",
			"data-highlighted": dataAttr(this.highlighted),
			[createAttachmentKey()]: (node) => {
				this.el = node;
				this.#props.lifecycle.onMount();

				return () => {
					this.el = null;
					this.#props.lifecycle.onUnmount();
				};
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get rect() {
		return this.el?.getBoundingClientRect();
	}

	onSelect() {
		this.#props.onSelect?.();
		this.#props.parent.onSelect?.(this.#props.value);
	}
}
