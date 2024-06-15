import { Synced } from "./Synced.svelte";
import type { MaybeGetter } from "./types";
import { createIdentifiers } from "./utils/identifiers.svelte";
import { isHtmlElement } from "./utils/is";

const TRIGGER_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];

const identifiers = createIdentifiers("tabs", ["trigger", "content", "trigger-list"]);

export type TabsProps<T extends string = string> = {
	/** @default true */
	selectWhenFocused?: MaybeGetter<boolean>;
	/**
	 * The default value for `tabs.active`.
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

export class Tabs<T extends string = string> {
	#value: Synced<T>;
	#props: TabsProps<T>;

	constructor(props: TabsProps<T> = {}) {
		this.#props = { selectWhenFocused: true, ...props };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.#value = new Synced<T>(props.value as any, props.onValueChange);
	}

	get value() {
		return this.#value.current;
	}

	set value(value: T) {
		this.#value.current = value;
	}

	get triggerList() {
		return {
			[identifiers.triggerList]: "",
		};
	}

	getTrigger(id: T) {
		if (this.value === undefined) {
			this.value = id;
		}

		return {
			[identifiers.trigger]: id,
			"data-active": this.value === id ? "" : undefined,
			tabindex: this.value === id ? 0 : -1,
			onclick: () => (this.value = id),
			onkeydown: (e: KeyboardEvent) => {
				const el = e.target;
				if (!TRIGGER_KEYS.includes(e.key) || !isHtmlElement(el)) {
					return;
				}

				e.preventDefault();
				const triggerList = el.closest(`[${identifiers.triggerList}]`);
				if (!triggerList) return;

				const triggers = [...triggerList.querySelectorAll(`[${identifiers.trigger}]`)];

				const currIndex = triggers.indexOf(el);
				let next = el as Element | undefined;
				switch (e.key) {
					case "ArrowLeft": {
						next = triggers.at(currIndex - 1);
						break;
					}
					case "ArrowRight": {
						next = triggers.at((currIndex + 1) % triggers.length);
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
		};
	}

	getContent(id: T) {
		return {
			[identifiers.content]: "",
			hidden: this.value !== id,
		};
	}
}
