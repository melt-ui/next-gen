
import { styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { clamp } from "$lib/utils/number";
import { Synced } from "../Synced.svelte";
import type { Getter, MaybeGetter } from "../types";

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
    #value: Synced<number[]>;

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

    /**
	 * The root of the slider.
	 * Any cursor interaction along this element will change the slider's values.
	 **/
    get root() {
        return {
            "aria-orientation": this.orientation
        };
    }

	get thumbs() {
		return this.value.map((v, i) => new Thumb({ slider: this, value: () => v, index: i }));
	}
}

type ThumbProps = {
	slider: SliderMultiThumb;
	value: Getter<number>;
	index: number;
}

class Thumb {
	/* Props */
	#props!: ThumbProps;
	slider = $derived(this.#props.slider);
	index = $derived(this.#props.index);
	
	/* State */
	#value: Synced<number>;
	// #mouseDown = false;
	// #dragging = false;

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