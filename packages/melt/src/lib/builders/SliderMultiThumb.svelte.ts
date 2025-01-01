import { useEventListener } from "runed";

import { styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { clamp } from "$lib/utils/number";
import { Synced } from "../Synced.svelte";
import { createDataIds, createIds } from "../utils/identifiers";
import { isHtmlElement } from "../utils/is";
import type { Getter, MaybeGetter } from "../types";

const dataIds = createDataIds("slider", ["root", "track", "thumb", "range"]);

export type SliderMultiThumbProps = {
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
	 * The default value.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that `value` only changes when the getter returns a new value.
	 *
	 * @default undefined
	 */
	value?: MaybeGetter<number[] | undefined>;
    /**
	 * Called when the `Slider` instance value changes.
	 */
	onValueChange?: (active: number[]) => void;
};

/**
 * TODO: description
 */
export class SliderMultiThumb {
    /* Props */
    #props!: SliderMultiThumbProps;
    readonly min = $derived(extract(this.#props.min, 0));
    readonly max = $derived(extract(this.#props.max, 100));
    readonly orientation = $derived(extract(this.#props.orientation, 'horizontal'));
    readonly step = $derived(extract(this.#props.step, 1));

    /* State */
    #value!: Synced<number[]>;
	readonly ids = createIds(dataIds);
	#mouseDown = false;
	#dragging = false;
	#mouseDownAt: null | number = null;
	#activeIndex: null | number = null;
	#numThumbs = $derived(this.#value ? this.#value.current.length : 1);

    constructor(props: SliderMultiThumbProps = {}) {
        this.#props = props;
        this.#value = new Synced({
            value: props.value,
            onChange: props.onValueChange,
            defaultValue: [0]
        });
    }

	/** The value of the slider. */
	get value() {
		return this.#value.current;
	}

	set value(value: number[]) {
		// TODO
	}

	set valueAtIndex(v: { value: number, index: number }) {
		const valueFixedToStep = Math.round(v.value / this.step) * this.step;
		this.#value.current[v.index] = clamp(this.min, valueFixedToStep, this.max);
	}

	#commit(e: PointerEvent) {
		if (!this.#activeIndex) return;

		this.#dragging = typeof this.#mouseDownAt === "number" && e.timeStamp - this.#mouseDownAt > 50;

		const el = document.getElementById(this.ids.root);
		if (!isHtmlElement(el)) return;

		e.preventDefault();

		const elRect = el.getBoundingClientRect();
		let percentage: number;

		if (this.orientation === "vertical") {
			percentage = 1 - clamp(0, e.clientY - elRect.top, elRect.height) / elRect.height;
		} else {
			percentage = clamp(0, e.clientX - elRect.left, elRect.width) / elRect.width;
		}

		this.valueAtIndex = { 
			value: this.min + percentage * (this.max - this.min),
			index: this.#activeIndex
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
				if (!this.#mouseDown || !this.#activeIndex) return;
				this.#commit(e);
			},
		);

		useEventListener(
			() => window,
			"pointerup",
			() => {
				this.#mouseDown = false;
				this.#dragging = false;
				this.#activeIndex = null;
			},
		);

        return {
            "aria-orientation": this.orientation,
			[dataIds.root]: "",
			id: this.ids.root,
        };
    }

	get thumbs() {
		// return this.value.map((v, i) => new Thumb({ 
		// 	slider: this, value: () => v, 
		// 	index: i,
		// 	onpointerdown: (e: PointerEvent) => {
		// 		this.#mouseDown = true;
		// 		this.#mouseDownAt = e.timeStamp;
		// 		this.#activeIndex = i;
		// 		this.#commit(e);
		// 	}
		// }));
		console.log('re-running');
		return Array(this.#numThumbs)
			.fill(null)
			.map((_, i) => new Thumb({
				slider: this,
				value: () => this.value[i],
				index: i,
				onpointerdown: (e) => {
					this.#mouseDown = true;
					this.#mouseDownAt = e.timeStamp;
					this.#activeIndex = i;
					this.#commit(e);
				}
			}));
	}
}

type ThumbProps = {
	slider: SliderMultiThumb;
	value: Getter<number>;
	index: number;
	onpointerdown: (e: PointerEvent) => void;
}

class Thumb {
	/* Props */
	#props!: ThumbProps;
	slider = $derived(this.#props.slider);
	index = $derived(this.#props.index);
	onpointerdown = $derived(this.#props.onpointerdown);
	
	/* State */
	#value: Synced<number>;

	constructor(props: ThumbProps) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			defaultValue: 0
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: number) {
		this.slider.valueAtIndex = { value, index: this.index };
	}

	get #percentage() {
		const v = (this.value - this.slider.min) / (this.slider.max - this.slider.min);
		return this.slider.orientation === "vertical" ? 1 - v : v;
	}

	get trigger() {
		return {
			"aria-valuenow": this.value,
			"aria-valuemin": this.slider.min,
			"aria-valuemax": this.slider.max,
			"aria-orientation": this.slider.orientation,
			role: "slider",
			tabindex: 0,
			id: null,
			style: styleAttr({
				[`--percentage`]: `${this.#percentage * 100}%`,
				[`--percentage-inv`]: `${(1 - this.#percentage) * 100}%`,
				"touch-action": this.slider.orientation === "vertical" ? "pan-x" : "pan-y"
			}),
			onpointerdown: this.onpointerdown,
			onkeydown: (e: KeyboardEvent) => {
				switch (e.key) {
					case "ArrowDown":
					case "ArrowLeft": {
						if (e.metaKey) this.value = this.slider.min;
						else this.value -= this.slider.step;
						break;
					}
					case "ArrowUp":
					case "ArrowRight": {
						if (e.metaKey) this.value = this.slider.max;
						else this.value += this.slider.step;
						break;
					}
					case "Home": {
						this.value = this.slider.min;
						break;
					}
					case "End": {
						this.value = this.slider.max;
						break;
					}
					default: {
						return;
					}
				}

				e.preventDefault();
			},
		};
	}
}