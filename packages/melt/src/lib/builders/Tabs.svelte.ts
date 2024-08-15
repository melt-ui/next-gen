import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract.svelte";
import { nanoid } from "nanoid";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "../types";
import { createIdentifiers } from "../utils/identifiers.svelte";
import { isHtmlElement } from "../utils/is";

const TRIGGER_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

const identifiers = createIdentifiers("tabs", ["trigger", "content", "trigger-list"]);

export type TabsProps<T extends string = string> = {
	/**
	 * If `true`, the value will be changed whenever a trigger is focused.
	 *
	 * @default true
	 */
	selectWhenFocused?: MaybeGetter<boolean | undefined>;
	/**
	 * If the the trigger selection should loop when navigating with the arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
	/**
	 * The orientation of the tabs.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical">;
	/**
	 * The default value for `tabs.value`
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that `tabs.value` only changes when the getter returns a new value.
	 *
	 * If omitted, it will use the first tab as default.
	 *
	 * @default undefined
	 */
	value?: MaybeGetter<T>;
	/**
	 * Called when the `Tabs` instance tries to change the active tab.
	 */
	onValueChange?: (active: T) => void;
};

export class Tabs<T extends string = string> {
	#value: Synced<T>;
	#id = nanoid();
	/* Props */
	#props!: TabsProps<T>;
	readonly selectWhenFocused = $derived(extract(this.#props.selectWhenFocused, true));
	readonly loop = $derived(extract(this.#props.loop, true));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));

	constructor(props: TabsProps<T> = {}) {
		this.#props = props;
		this.#value = new Synced<T>(props.value as T, props.onValueChange);
	}

	#getTriggerId(value: T) {
		return `${this.#id}-trigger-${value.replace(/\s/g, "_")}`;
	}

	#getContentId(value: T) {
		return `${this.#id}-content-${value.replace(/\s/g, "_")}`;
	}

	/** The current selected tab. */
	get value() {
		return this.#value.current;
	}

	set value(value: T) {
		this.#value.current = value;
	}

	/** The attributes for the list that contains the tab triggers. */
	get triggerList() {
		return {
			[identifiers["trigger-list"]]: "",
			role: "tablist",
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
		} as const;
	}

	/** Gets the attributes and listeners for a tab trigger. Requires an identifying tab value. */
	getTrigger(value: T) {
		if (this.value === undefined) {
			this.value = value;
		}

		return {
			[identifiers.trigger]: value,
			"data-active": dataAttr(this.value === value),
			tabindex: this.value === value ? 0 : -1,
			role: "tab",
			"aria-selected": this.value === value,
			"aria-controls": this.#getContentId(value),
			"data-orientation": this.orientation,
			onclick: () => (this.value = value),
			onkeydown: (e: KeyboardEvent) => {
				const el = e.target;
				if (!TRIGGER_KEYS.includes(e.key) || !isHtmlElement(el)) {
					return;
				}

				e.preventDefault();
				const triggerList = el.closest(`[${identifiers["trigger-list"]}]`);
				if (!triggerList) return;

				const triggers = [...triggerList.querySelectorAll(`[${identifiers.trigger}]`)];

				const currIndex = triggers.indexOf(el);
				let next = el as Element | undefined;

				const prevKey = this.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
				const nextKey = this.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
				console.log(currIndex, prevKey, nextKey);
				switch (e.key) {
					case prevKey: {
						next = this.loop ? triggers.at(currIndex - 1) : triggers.at(Math.max(currIndex - 1, 0));
						break;
					}
					case nextKey: {
						next = this.loop
							? triggers.at((currIndex + 1) % triggers.length)
							: triggers.at(currIndex + 1);
						break;
					}
					case "Home": {
						next = triggers[0];
						break;
					}
					case "End": {
						next = triggers.at(-1);
						break;
					}
				}

				if (!isHtmlElement(next)) return;
				next.focus();

				if (this.selectWhenFocused) {
					this.value = next.getAttribute(identifiers.trigger) as T;
				}
			},
			id: this.#getTriggerId(value),
		} as const;
	}

	/** Gets the attributes and listeners for the tabs contents. Requires an identifying tab value. */
	getContent(value: T) {
		return {
			[identifiers.content]: "",
			hidden: this.value !== value,
			"data-active": dataAttr(this.value === value),
			role: "tabpanel",
			id: this.#getContentId(value),
			"aria-labelledby": this.#getTriggerId(value),
			"data-orientation": this.orientation,
		} as const;
	}
}
