<script lang="ts">
	import { Slider, type SliderProps } from "../builders/Slider.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders/utils.svelte";

	type Props = ComponentProps<SliderProps> & {
		children: Snippet<[Slider]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const slider = new Slider({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(slider)}
