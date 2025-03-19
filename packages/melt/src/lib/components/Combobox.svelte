<script lang="ts" generics="T extends string, Multiple extends boolean">
	import { getters } from "../builders/utils.svelte";
	import { type Snippet } from "svelte";
	import { Combobox as Builder, type ComboboxProps } from "../builders/Combobox.svelte";
	import type { ComponentProps } from "../types";

	type Props = Omit<ComponentProps<ComboboxProps<T, Multiple>>, "multiple"> & {
		children: Snippet<[Builder<T, Multiple>]>;
		multiple?: Multiple;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const select = new Builder<T, Multiple>({
		value: () => value as unknown as any,
		onValueChange(v) {
			value = v as unknown as any;
		},
		...getters({ ...rest }),
	});
</script>

{@render children(select)}

