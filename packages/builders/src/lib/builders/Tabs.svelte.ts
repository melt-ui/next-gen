import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "../types";
import { createIdentifiers } from "../utils/identifiers.svelte";
import { isHtmlElement } from "../utils/is";
import { omit } from "../utils/object";
import { parseProps, type ParsedProps } from "../utils/props.svelte";

const TRIGGER_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];

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
	 * The default value for `tabs.value`.
	 *
	 * When passing a getter, will be used as source of truth,
	 * meaning that tabs.active only changes when the getter returns a new value.
	 *
	 * @default undefined
	 */
	value?: MaybeGetter<T>;
	/**
	 * Called when the `Tabs` instance tries to change the active tab.
	 */
	onValueChange?: (active: T) => void;
};

const defaults = {
	selectWhenFocused: true,
	loop: true,
} satisfies Partial<TabsProps>;

export class Tabs<T extends string = string> {
	#value: Synced<T>;
	#props: ParsedProps<Omit<TabsProps<T>, "value" | "onValueChange">, typeof defaults>;

	constructor(props: TabsProps<T> = {}) {
		this.#props = parseProps(omit(props, "value", "onValueChange"), defaults);
		this.#value = new Synced<T>(props.value as T, props.onValueChange);
	}

	/** The current selected tab. */
	get value() {
		return this.#value.current;
	}

	set value(value: T) {
		this.#value.current = value;
	}

	/** The attributes for the list that contains the tab triggers */
	get triggerList() {
		return {
			[identifiers["trigger-list"]]: "",
			role: "tablist",
		} as const;
	}

	/** Gets the attributes and listeners for a tab trigger. Requires an identifying tab value */
	getTrigger(value: T) {
		if (this.value === undefined) {
			this.value = value;
		}

		return {
			[identifiers.trigger]: value,
			"data-active": this.value === value ? "" : undefined,
			tabindex: this.value === value ? 0 : -1,
			role: "tab",
			"aria-selected": this.value === value,
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
				switch (e.key) {
					case "ArrowLeft": {
						next = this.#props.loop
							? triggers.at(currIndex - 1)
							: triggers.at(Math.max(currIndex - 1, 0));
						break;
					}
					case "ArrowRight": {
						next = this.#props.loop
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

				if (this.#props.selectWhenFocused) {
					this.value = next.getAttribute(identifiers.trigger) as T;
				}
			},
		} as const;
	}


	/** Gets the attributes and listeners for the tabs contents. Requires an identifying tab value */
	getContent(value: T) {
		return {
			[identifiers.content]: "",
			hidden: this.value !== value,
		} as const;
	}
}
