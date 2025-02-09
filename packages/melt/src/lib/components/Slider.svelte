<script lang="ts">
	import { Slider as Builder, type SliderProps } from "../builders/Slider.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders/utils.svelte";

	type Props = ComponentProps<SliderProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const slider = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(slider)}
