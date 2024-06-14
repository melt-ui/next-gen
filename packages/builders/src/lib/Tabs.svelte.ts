import type { MaybeGetter } from "./types";
import { extract } from "./utils/extract.svelte";
import { isFunction, isHtmlElement } from "./utils/is";

const TRIGGER_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];

function createIdentifiers<Parts extends string[]>(name: string, parts: Parts) {
	return parts.reduce((acc, part) => {
		acc[part as Parts[number]] = `data-melt-${name}-${part}`;
		return acc;
	}, {} as Record<Parts[number], string>);
}
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
	active?: MaybeGetter<T>;
	/**
	 * Called when the `Tabs` instance tries to change the active tab.
	 */
	onActiveChange?: (active: T) => void;
};

export class Tabs<T extends string = string> {
	active = $state<T>();
	#props: TabsProps<T>;
	#activeProp = $derived.by(() => extract(this.#props.active));

	constructor(props: TabsProps<T> = {}) {
		this.#props = { selectWhenFocused: true, ...props };

		const initActive = () => {
			if (this.#activeProp === undefined) return;
			this.active = this.#activeProp;
		};
		initActive();
		$effect(initActive);
	}

	#setActive(newActive: T) {
		this.#props.onActiveChange?.(newActive);

		if (!isFunction(this.#props.active)) {
			this.active = newActive;
		}
	}

	get triggerList() {
		return {
			[identifiers.triggerList]: "",
		};
	}

	getTrigger(id: T) {
		if (this.active === undefined) {
			this.#setActive(id);
		}

		return {
			[identifiers.trigger]: id,
			"data-active": this.active === id ? "" : undefined,
			"tabindex": this.active === id ? 0 : -1,
			"onclick": () => (this.#setActive(id)),
			"onkeydown": (e: KeyboardEvent) => {
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
					this.#setActive(next.getAttribute(identifiers.trigger) as T);
				}
			},
		};
	}

	getContent(id: T) {
		return {
			[identifiers.content]: "",
			hidden: this.active !== id,
		};
	}
}
