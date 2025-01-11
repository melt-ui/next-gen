import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";


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
	 * The default value of the progress.
	 * 
	 * @default 0
	 */
	defaultValue?: MaybeGetter<number | undefined>;

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

	constructor(props: ProgressProps) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: extract(props.defaultValue, 0)
		});
	}

	get value() {
		return this.#value.current;
	}

	get root() {
		return {
			value: this.#value.current,
			max: this.max,
			role: 'meter',
			'aria-valuemin': 0,
			'aria-valuemax': this.max,
			'aria-valuenow': this.#value.current,
			'data-value': this.#value.current,
			'data-state': this.#value.current === this.max ? 'complete' : 'loading',
			'data-max': this.max,
		};
	}

	get progress() {
		return {
			style: styleAttr({
				'--progress': `${100 - (100 * (this.#value.current ?? 0)) / (this.max ?? 1)}%`
			})
		}
	}
}