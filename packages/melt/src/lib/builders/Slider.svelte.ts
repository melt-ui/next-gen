import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract.svelte";
import { clamp } from "$lib/utils/number";
import { useEventListener } from "runed";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "../types";
import { createDataIds, createIds } from "../utils/identifiers.svelte";
import { isHtmlElement } from "../utils/is";

const dataIds = createDataIds("slider", ["root", "track", "thumb", "range"]);

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
	/* Props */
	#props!: SliderProps;
	readonly min = $derived(extract(this.#props.min, 0));
	readonly max = $derived(extract(this.#props.max, 100));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));
	readonly step = $derived(extract(this.#props.step, 1));

	/* State */
	#value: Synced<number>;
	#ids = createIds(dataIds);
	#mouseDown = false;
	#dragging = false;
	#mouseDownAt: null | number = null;
	readonly #percentage = $derived((this.value - this.min) / (this.max - this.min));

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
		this.#dragging = typeof this.#mouseDownAt === "number" && e.timeStamp - this.#mouseDownAt > 50;
		const el = document.getElementById(this.#ids.root);
		if (!isHtmlElement(el)) return;

		const elRect = el.getBoundingClientRect();
		const percentage = clamp(0, e.clientX - elRect.left, elRect.width) / elRect.width;
		this.value = this.min + percentage * (this.max - this.min);
	}

	get #sharedProps() {
		return {
			"data-dragging": dataAttr(this.#dragging),
		};
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
				if (!this.#mouseDown) return;
				this.#commit(e);
			},
		);

		useEventListener(
			() => window,
			"mouseup",
			() => {
				this.#mouseDown = false;
				this.#dragging = false;
			},
		);

		return {
			[dataIds.root]: "",
			id: this.#ids.root,
			onmousedown: (e: MouseEvent) => {
				e.preventDefault();
				this.#mouseDown = true;
				this.#mouseDownAt = e.timeStamp;
				this.#commit(e);
			},
			style: styleAttr({
				"--percentage": `${this.#percentage * 100}%`,
				"--percentage-inv": `${(1 - this.#percentage) * 100}%`,
			}),
			...this.#sharedProps,
		} as const;
	}

	/** The track in which the thumb and range sit upon. */
	get track() {
		return {
			[dataIds.track]: "",
			"data-value": dataAttr(this.value),
			...this.#sharedProps,
		};
	}

	/** The range indicating the slider's value. */
	get range() {
		return {
			[dataIds.range]: "",
			"data-value": dataAttr(this.value),
			...this.#sharedProps,
		};
	}

	/** The slider's thumb, positioned at the end of the range. */
	get thumb() {
		return {
			[dataIds.thumb]: "",
			"data-value": dataAttr(this.value),
			tabindex: 0,
			...this.#sharedProps,
		} as const;
	}
}
