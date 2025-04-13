<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import {
		Avatar as Builder,
		type AvatarProps,
		type ImageLoadingStatus,
	} from "../builders/Avatar.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<AvatarProps> & {
		children: Snippet<[Builder]>;
		onLoadingStatusChange?: (value: ImageLoadingStatus) => void | undefined;
	};

	let { children, onLoadingStatusChange, ...rest }: Props = $props();

	export const avatar = new Builder(getters({ ...rest }));
</script>

{@render children(avatar)}
