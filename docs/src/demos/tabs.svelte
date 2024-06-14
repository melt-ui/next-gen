<script lang="ts">
	import { Tabs } from "@melt-ui/builders";

	const tabIds = ["Tab 1", "Tab 2", "Tab 3"] as const;
	type TabId = typeof tabIds[number];
	const tabs = new Tabs<TabId>();

	let active = $state<TabId>("Tab 2");
	const controlledTabs = new Tabs<TabId>({
		active: () => active,
		onActiveChange(id) {
			active = id;
		},
	});

	const readonlyTabs = new Tabs<TabId>({
		active: () => "Tab 3",
	});
</script>

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

<h2>Controlled</h2>

<div class="flex gap-2 items-center" {...controlledTabs.triggerList}>
	{#each tabIds as id}
		<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...controlledTabs.getTrigger(id)}>
			{id}
		</button>
	{/each}
</div>

{#each tabIds as id}
	<div {...controlledTabs.getContent(id)} class="[hidden]:hidden">
		{id}
	</div>
{/each}
Active: {active}

<h2>Readonly</h2>

<div class="flex gap-2 items-center" {...readonlyTabs.triggerList}>
	{#each tabIds as id}
		<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...readonlyTabs.getTrigger(id)}>
			{id}
		</button>
	{/each}
</div>

{#each tabIds as id}
	<div {...readonlyTabs.getContent(id)} class="[hidden]:hidden">
		{id}
	</div>
{/each}
