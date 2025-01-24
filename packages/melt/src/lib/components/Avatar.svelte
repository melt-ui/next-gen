<script lang="ts">
	import { Avatar, type AvatarProps, type ImageLoadingStatus } from "../builders/Avatar.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<AvatarProps> & {
		children: Snippet<[Avatar]>;
		onLoadingStatusChange?: (value: ImageLoadingStatus) => void | undefined;
	};

	let { children, onLoadingStatusChange, ...rest }: Props = $props();

	const avatar = new Avatar(getters({ ...rest }));
</script>

{@render children(avatar)}
