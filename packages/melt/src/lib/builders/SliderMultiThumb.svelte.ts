import { useEventListener } from "runed";

import { styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { clamp } from "$lib/utils/number";
import { Synced } from "../Synced.svelte";
import { createDataIds, createIds } from "../utils/identifiers";
import { isHtmlElement } from "../utils/is";
import type { MaybeGetter } from "../types";

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
	#ids = createIds(dataIds);
	#mouseDown = false;
	#dragging = false;
	#mouseDownAt: null | number = null;
	#activeIndex: null | number = null;
	#numThumbs = $derived(this.#value.current.length);
	#elRoot: HTMLElement | null = null;

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
		value.forEach((v, i) => this.updateValueAtIndex({ value: v, index: i}));
	}

	updateValueAtIndex(v: { value: number, index: number }) {
		const valueFixedToStep = Math.round(v.value / this.step) * this.step;
		this.#value.current[v.index] = clamp(this.min, valueFixedToStep, this.max);
	}

	#commit(e: PointerEvent) {
		console.log('commit');
		if (this.#activeIndex === null) return;
		
		this.#dragging = typeof this.#mouseDownAt === "number" && e.timeStamp - this.#mouseDownAt > 50;
		
		if (!this.#elRoot) {
			this.#elRoot = document.getElementById(this.#ids.root);
			
			if (!isHtmlElement(this.#elRoot)) return;
		}

		e.preventDefault();

		const elRect = this.#elRoot.getBoundingClientRect();
		// console.log('elRect:', elRect);
		let percentage: number;

		if (this.orientation === "vertical") {
			percentage = 1 - clamp(0, e.clientY - elRect.top, elRect.height) / elRect.height;
		} else {
			percentage = clamp(0, e.clientX - elRect.left, elRect.width) / elRect.width;
		}

		this.updateValueAtIndex({ 
			value: this.min + percentage * (this.max - this.min),
			index: this.#activeIndex
		});
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
				if (!this.#mouseDown || this.#activeIndex === null) return;
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
			id: this.#ids.root,
        };
    }

	get thumbs() {
		console.log('re-running');

		return Array(this.#numThumbs)
			.fill(null)
			.map((_, i) => new Thumb({
				slider: this,
				index: i,
				onpointerdown: (e) => {
					this.#activeIndex = i;
					this.#mouseDown = true;
					this.#mouseDownAt = e.timeStamp;
					this.#commit(e);
				}
			}));
	}
}

type ThumbProps = {
	slider: SliderMultiThumb;
	index: number;
	onpointerdown: (e: PointerEvent) => void;
}

class Thumb {
	/* Props */
	#props!: ThumbProps;
	#slider = $derived(this.#props.slider);
	#index = $derived(this.#props.index);
	#onpointerdown = $derived(this.#props.onpointerdown);

	constructor(props: ThumbProps) {
		this.#props = props;
	}

	get value() {
		return this.#slider.value[this.#index];
	}

	set value(value: number) {
		this.#slider.updateValueAtIndex({ value, index: this.#index });
	}

	get #percentage() {
		const v = (this.value - this.#slider.min) / (this.#slider.max - this.#slider.min);
		return this.#slider.orientation === "vertical" ? 1 - v : v;
	}

	get trigger() {
		return {
			"aria-valuenow": this.value,
			"aria-valuemin": this.#slider.min,
			"aria-valuemax": this.#slider.max,
			"aria-orientation": this.#slider.orientation,
			role: "slider",
			tabindex: 0,
			id: null,
			style: styleAttr({
				[`--percentage`]: `${this.#percentage * 100}%`,
				[`--percentage-inv`]: `${(1 - this.#percentage) * 100}%`,
				"touch-action": this.#slider.orientation === "vertical" ? "pan-x" : "pan-y"
			}),
			onpointerdown: this.#onpointerdown,
			onkeydown: (e: KeyboardEvent) => {
				switch (e.key) {
					case "ArrowDown":
					case "ArrowLeft": {
						if (e.metaKey) this.value = this.#slider.min;
						else this.value -= this.#slider.step;
						break;
					}
					case "ArrowUp":
					case "ArrowRight": {
						if (e.metaKey) this.value = this.#slider.max;
						else this.value += this.#slider.step;
						break;
					}
					case "Home": {
						this.value = this.#slider.min;
						break;
					}
					case "End": {
						this.value = this.#slider.max;
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