import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import {
	SelectionState,
	type MaybeMultiple,
	type OnMultipleChange,
} from "$lib/utils/selection-state.svelte";
import type { ComputePositionConfig } from "@floating-ui/dom";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("select", [
	"trigger",
	"content",
	"option",
]);

export type SelectProps<T extends string, Multiple extends boolean = false> = {
	/**
	 * If `true`, multiple options can be selected at the same time.
	 *
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;

	/**
	 * The value for the Select.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	value?: MaybeMultiple<T, Multiple>;
	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: OnMultipleChange<T, Multiple>;

	/**
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * Options to be passed to Floating UI's `computePosition`
	 *
	 * @see https://floating-ui.com/docs/computePosition
	 */
	computePositionOptions?: MaybeGetter<Partial<ComputePositionConfig> | undefined>;
};

export class Select<T extends string, Multiple extends boolean = false> {
	/* Props */
	#props!: SelectProps<T, Multiple>;

	/* State */
	#value!: SelectionState<T, Multiple>;

	constructor(props: SelectProps<T, Multiple> = {}) {
		this.#props = props;
		this.#value = new SelectionState({
			value: props.value,
			onChange: props.onValueChange,
			multiple: props.multiple,
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}
}

