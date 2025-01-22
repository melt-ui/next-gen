<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Avatar } from "melt/components";

	const controls = usePreviewControls({
		src: {
			label: "Source",
			defaultValue: "https://avatars.githubusercontent.com/u/1162160?v=4",
			type: "string",
		},
		delayMs: {
			label: "Delay (ms)",
			type: "number",
			defaultValue: 650,
		},
	});
</script>

<Preview>
	<Avatar {...controls}>
		{#snippet children(avatar)}
			<div class="flex w-full items-center justify-center gap-6">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
					<img {...avatar.image} alt="Avatar" class="h-full w-full rounded-[inherit]" />
					<span {...avatar.fallback} class="text-magnum-700 text-3xl font-medium">RH</span>
				</div>
			</div>
		{/snippet}
	</Avatar>
</Preview>
