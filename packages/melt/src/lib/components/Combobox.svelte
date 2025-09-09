<script lang="ts" generics="T, Multiple extends boolean">
	import { getters } from "../utils/getters.svelte";
	import { type Snippet } from "svelte";
	import { Combobox as Builder, type ComboboxProps } from "../builders/Combobox.svelte";
	import type { ComponentProps } from "../types";

	type Props = Omit<ComponentProps<ComboboxProps<T, Multiple>>, "multiple" | "onNavigate"> & {
		children: Snippet<[Builder<T, Multiple>]>;
		multiple?: Multiple;
		onNavigate?: (current: T | null, direction: "next" | "prev") => T | null;
	};

	let { value = $bindable(), highlighted = $bindable(), children, ...rest }: Props = $props();

	export const select = new Builder<T, Multiple>({
		value: () => value as unknown as any,
		onValueChange(v) {
			value = v as unknown as any;
		},
		highlighted: () => highlighted as unknown as any,
		onHighlightChange(v) {
			highlighted = v as unknown as any;
		},
		...getters({ ...rest }),
		focus: {
			...getters(rest).focus,
		},
		// onNavigate should not be wrapped in a getter since it's a callback function
		onNavigate: rest.onNavigate,
	});
</script>

{@render children(select)}
