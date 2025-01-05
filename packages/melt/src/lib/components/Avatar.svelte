<script lang="ts">
	import { Avatar, type AvatarProps } from "../builders/Avatar.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<AvatarProps> & {
		children: Snippet<[Avatar]>;
	};

	let { children, ...rest }: Props = $props();

	const avatar = new Avatar(getters({ ...rest }));
</script>

{@render children(avatar)}
