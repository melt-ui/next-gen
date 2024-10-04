import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract.svelte";
import { nanoid } from "nanoid";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "../types";
import { createIdentifiers } from "../utils/identifiers.svelte";
import { isHtmlElement } from "../utils/is";
import { clamp } from "$lib/utils/number";
import { useEventListener } from "runed";

const identifiers = createIdentifiers("slider", ["root", "track", "thumb", "range"]);

export type SliderProps = {
	/**
	 * The minimum value of the slider.
	 *
	 * @default 0
	 */
	min?: MaybeGetter<number | undefined>;
	/**
	 * The maximum value of the slider.
	 *
	 * @default 100
	 */
	max?: MaybeGetter<number | undefined>;
	/**
	 * The orientation of the slider.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;

	/**
	 * The step size of the slider.
	 *
	 * @default 1
	 */
	step?: MaybeGetter<number>;
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
	value?: MaybeGetter<number | undefined>;
	/**
	 * Called when the `Slider` instance tries to change the active tab.
	 */
	onValueChange?: (active: number) => void;
};

export class Slider {
	#value: Synced<number>;
	#id = nanoid();

	#dragging = false;
	/* Props */
	#props!: SliderProps;
	readonly min = $derived(extract(this.#props.min, 0));
	readonly max = $derived(extract(this.#props.max, 100));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));
	readonly step = $derived(extract(this.#props.step, 1));

	constructor(props: SliderProps = {}) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: 0,
		});
	}

	/** The value of the slider. */
	get value() {
		return this.#value.current;
	}

	set value(value: number) {
		this.#value.current = value;
	}

	#commit(e: MouseEvent) {
		const el = document.getElementById(this.#id);
		if (!isHtmlElement(el)) return;

		const elRect = el.getBoundingClientRect();
		const percentage = clamp(0, e.clientX - elRect.left, elRect.width) / elRect.width;
		this.value = this.min + percentage * (this.max - this.min);
	}

	/**
	 * The root of the slider.
	 * Any cursor interaction along this element will change the slider's values.
	 **/
	get root() {
		useEventListener(
			() => window,
			"mousemove",
			(e: MouseEvent) => {
				if (!this.#dragging) return;
				this.#commit(e);
			},
		);

		useEventListener(
			() => window,
			"mouseup",
			() => {
				this.#dragging = false;
			},
		);

		return {
			[identifiers.root]: "",
			id: this.#id,
			onmousedown: () => {
				this.#dragging = true;
			},
			style: styleAttr({
				"--percentage": `${((this.value - this.min) / (this.max - this.min)) * 100}%`,
			}),
		} as const;
	}

	/** The track in which the thumb and range sit upon. */
	get track() {
		return {
			[identifiers.track]: "",
			"data-value": dataAttr(this.value),
		};
	}

	/** The range indicating the slider's value. */
	get range() {
		return {
			[identifiers.range]: "",
			"data-value": dataAttr(this.value),
		};
	}

	/** The slider's thumb, positioned at the end of the range. */
	get thumb() {
		return {
			[identifiers.thumb]: "",
			"data-value": dataAttr(this.value),
		} as const;
	}
}
