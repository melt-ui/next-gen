<script lang="ts" generics="T, Multiple extends boolean">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Combobox as Builder, type ComboboxProps } from "../builders/Combobox.svelte";
	import type { ComponentProps } from "../types";

	type Props = Omit<ComponentProps<ComboboxProps<T, Multiple>>, "multiple"> & {
		children: Snippet<[Builder<T, Multiple>]>;
		multiple?: Multiple;
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
	});
</script>

{@render children(select)}
