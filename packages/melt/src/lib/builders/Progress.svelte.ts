import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";

const dataIds = createDataIds("progress", ["root", "progress"]);

export type ProgressProps = {
	/**
	 * The value for the progress.
	 *
	 * @default undefined
	 */
	value?: MaybeGetter<number | undefined>;

	/**
	 * The maximum value of the progress.
	 *
	 * @deafult 100
	 */
	max?: MaybeGetter<number | undefined>;

	/**
	 * The callback invoked when the value of the progress changes.
	 */
	onValueChange?: (value: number) => void;
};

export class Progress {
	// Props
	#props!: ProgressProps;
	readonly max = $derived(extract(this.#props.max, 100));

	// States
	#value: Synced<number>;

	constructor(props: ProgressProps = {}) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: 0,
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: number) {
		this.#value.current = value;
	}

	/**
	 * Spread attributes for the Progress root element.
	 */
	get root() {
		return {
			[dataIds.root]: "",
			value: this.#value.current,
			max: this.max,
			role: "progressbar",
			"aria-valuemin": 0,
			"aria-valuemax": this.max,
			"aria-valuenow": this.#value.current,
			"data-value": this.#value.current,
			"data-state": this.#value.current === this.max ? "complete" : "loading",
			"data-max": this.max,
		};
	}

	/**
	 * Spread attributes for the Progress percentage element.
	 * Provides a --progress CSS variable that can be used to style the progress:
	 * `transform: translateX(calc(var(--progress) * -1));`
	 */
	get progress() {
		return {
			[dataIds.progress]: "",
			style: styleAttr({
				"--progress": `${100 - (100 * (this.#value.current ?? 0)) / (this.max ?? 1)}%`,
				"--neg-progress": `-${100 - (100 * (this.#value.current ?? 0)) / (this.max ?? 1)}%`,
			}),
		};
	}
}
