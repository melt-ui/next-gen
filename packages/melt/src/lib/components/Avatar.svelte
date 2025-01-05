<script lang="ts">
	import { Avatar, type AvatarProps } from "../builders/Avatar.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<AvatarProps> & {
		children: Snippet<[Avatar]>;
	};

	let { children, ...rest }: Props = $props();

	const avatar = $derived(new Avatar({ ...rest }));
</script>

{@render children(avatar)}
