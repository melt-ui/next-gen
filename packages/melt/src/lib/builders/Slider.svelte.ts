import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { clamp } from "$lib/utils/number";
import { useEventListener } from "runed";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "../types";
import { createDataIds, createIds } from "../utils/identifiers";
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
	step?: MaybeGetter<number | undefined>;
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

	constructor(props: SliderProps = {}) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: 0,
		});

		$effect.pre(() => {
			const valueFixedToStep = Math.round(this.#value.current / this.step) * this.step;
			this.#value.current = clamp(this.min, valueFixedToStep, this.max);
		});
	}

	/** The value of the slider. */
	get value() {
		return this.#value.current;
	}

	set value(value: number) {
		const valueFixedToStep = Math.round(value / this.step) * this.step;
		this.#value.current = clamp(this.min, valueFixedToStep, this.max);
	}

	get #percentage() {
		const v = (this.value - this.min) / (this.max - this.min);
		return this.orientation === "vertical" ? 1 - v : v;
	}

	#commit(e: PointerEvent) {
		this.#dragging = typeof this.#mouseDownAt === "number" && e.timeStamp - this.#mouseDownAt > 50;
		const el = document.getElementById(this.#ids.root);
		if (!isHtmlElement(el)) return;
		e.preventDefault();

		const elRect = el.getBoundingClientRect();
		let percentage: number;

		if (this.orientation === "vertical") {
			percentage = 1 - clamp(0, e.clientY - elRect.top, elRect.height) / elRect.height;
		} else {
			percentage = clamp(0, e.clientX - elRect.left, elRect.width) / elRect.width;
		}

		this.value = this.min + percentage * (this.max - this.min);
	}

	get #sharedProps() {
		return {
			"data-dragging": dataAttr(this.#dragging),
			"data-value": dataAttr(this.value),
			"data-orientation": dataAttr(this.orientation),
		};
	}

	/**
	 * The root of the slider.
	 * Any cursor interaction along this element will change the slider's values.
	 **/
	get root() {
		useEventListener(
			() => window,
			"pointermove",
			(e: PointerEvent) => {
				if (!this.#mouseDown) return;
				this.#commit(e);
			},
		);

		useEventListener(
			() => window,
			"pointerup",
			() => {
				this.#mouseDown = false;
				this.#dragging = false;
			},
		);

		return {
			"aria-valuenow": this.value,
			"aria-valuemin": this.min,
			"aria-valuemax": this.max,
			"aria-orientation": this.orientation,
			style: styleAttr({
				"--percentage": `${this.#percentage * 100}%`,
				"--percentage-inv": `${(1 - this.#percentage) * 100}%`,
				"touch-action": this.orientation === "vertical" ? "pan-x" : "pan-y",
			}),
			tabindex: 0,
			role: "slider",
			[dataIds.root]: "",
			id: this.#ids.root,
			onpointerdown: (e: PointerEvent) => {
				this.#mouseDown = true;
				this.#mouseDownAt = e.timeStamp;
				this.#commit(e);
			},
			onkeydown: (e: KeyboardEvent) => {
				switch (e.key) {
					case "ArrowDown":
					case "ArrowLeft": {
						if (e.metaKey) this.value = this.min;
						else this.value -= this.step;
						break;
					}
					case "ArrowUp":
					case "ArrowRight": {
						if (e.metaKey) this.value = this.max;
						else this.value += this.step;
						break;
					}
					case "Home": {
						this.value = this.min;
						break;
					}
					case "End": {
						this.value = this.max;
						break;
					}
					default: {
						return;
					}
				}

				e.preventDefault();
			},
			...this.#sharedProps,
		} as const;
	}

	/** The slider's thumb, positioned at the end of the range. */
	get thumb() {
		return {
			[dataIds.thumb]: "",
			tabindex: 0,
			...this.#sharedProps,
		} as const;
	}
}
