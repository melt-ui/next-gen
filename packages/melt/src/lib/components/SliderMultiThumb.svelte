<script lang="ts">
	import {
		SliderMultiThumb,
		type SliderMultiThumbProps,
	} from "../builders/SliderMultiThumb.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders/utils.svelte";

	type Props = ComponentProps<SliderMultiThumbProps> & {
		children: Snippet<[SliderMultiThumb]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const slider = new SliderMultiThumb({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(slider)}
