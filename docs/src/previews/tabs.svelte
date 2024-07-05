<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tabs } from "@melt-ui/builders";

	const controls = usePreviewControls({
		loop: { label: "Loop", defaultValue: true },
		selectWhenFocused: { label: "Select when focused", defaultValue: true },
	});

	const tabIds = ["Tab 1", "Tab 2", "Tab 3", "Tab 4"] as const;
	const tabs = new Tabs({
		loop: () => controls.loop,
		selectWhenFocused: () => controls.selectWhenFocused,
	});
</script>

<Preview>
	<div class="flex gap-2 items-center" {...tabs.triggerList}>
		{#each tabIds as id}
			<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...tabs.getTrigger(id)}>
				{id}
			</button>
		{/each}
	</div>

	{#each tabIds as id}
		<div {...tabs.getContent(id)} class="[hidden]:hidden">
			{id}
		</div>
	{/each}
</Preview>
