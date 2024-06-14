<script lang="ts">
	import { Tabs as TabsBuilder } from "@melt-ui/builders";
	import { Tabs } from "@melt-ui/components";

	const tabIds = ["Tab 1", "Tab 2", "Tab 3", "Tab 4"] as const;
	type TabId = typeof tabIds[number];
	const tabs = new TabsBuilder<TabId>();

	const withDefault = new TabsBuilder<TabId>({
		value: "Tab 2",
	});

	let value = $state<TabId>("Tab 3");
	const controlledTabs = new TabsBuilder<TabId>({
		value: () => value,
		onValueChange(id) {
			value = id;
		},
	});

	const readonlyTabs = new TabsBuilder<TabId>({
		value: () => "Tab 4",
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

<h2>With default</h2>

<div class="flex gap-2 items-center" {...withDefault.triggerList}>
	{#each tabIds as id}
		<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...withDefault.getTrigger(id)}>
			{id}
		</button>
	{/each}
</div>

{#each tabIds as id}
	<div {...withDefault.getContent(id)} class="[hidden]:hidden">
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
Active: {value}

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

<h2>Component</h2>

<Tabs.Root>
	<Tabs.TriggerList class="flex gap-2 items-center">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" id={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" id={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>Component with default</h2>

<Tabs.Root value="Tab 2">
	<Tabs.TriggerList class="flex gap-2 items-center">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" id={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" id={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>Controlled Component (syncs with controlled)</h2>

<Tabs.Root bind:value={value}>
	<Tabs.TriggerList class="flex gap-2 items-center">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" id={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" id={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>AsChild</h2>

<Tabs.Root>
	<Tabs.TriggerList class="flex gap-2 items-center">
		{#each tabIds as id}
			<Tabs.Trigger id={id}>
				{#snippet asChild(props)}
				<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...props}>
					{id}
				</button>
				{/snippet}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" id={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>
