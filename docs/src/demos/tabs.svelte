<script lang="ts">
	import { Tabs as TabsBuilder } from "@melt-ui/builders";
	import { Tabs } from "@melt-ui/components";

	const tabIds = ["Tab 1", "Tab 2", "Tab 3", "Tab 4"] as const;
	type TabId = (typeof tabIds)[number];
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

	let selectWhenFocused = $state(true);
	let loop = $state(true);
	const withOptions = new TabsBuilder<TabId>({
		selectWhenFocused: () => selectWhenFocused,
		loop: () => loop,
	});
</script>

<div class="flex items-center gap-2" {...tabs.triggerList}>
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

<div class="flex items-center gap-2" {...withDefault.triggerList}>
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

<div class="flex items-center gap-2" {...controlledTabs.triggerList}>
	{#each tabIds as id}
		<button
			class="!m-0 hover:opacity-75 data-[active]:font-bold"
			{...controlledTabs.getTrigger(id)}
		>
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

<div class="flex items-center gap-2" {...readonlyTabs.triggerList}>
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
	<Tabs.TriggerList class="flex items-center gap-2">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" value={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" value={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>Component with default</h2>

<Tabs.Root value="Tab 2">
	<Tabs.TriggerList class="flex items-center gap-2">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" value={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" value={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>Controlled Component (syncs with controlled)</h2>

<Tabs.Root bind:value>
	<Tabs.TriggerList class="flex items-center gap-2">
		{#each tabIds as id}
			<Tabs.Trigger class="!m-0 hover:opacity-75 data-[active]:font-bold" value={id}>
				{id}
			</Tabs.Trigger>
		{/each}
	</Tabs.TriggerList>

	{#each tabIds as id}
		<Tabs.Content class="[hidden]:hidden" value={id}>
			{id}
		</Tabs.Content>
	{/each}
</Tabs.Root>

<h2>AsChild</h2>

<Tabs.Root>
	{#snippet children(tabs)}
		<Tabs.TriggerList class="flex items-center gap-2">
			{#each tabIds as id}
				<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...tabs.getTrigger(id)}>
					{id}
				</button>
			{/each}
		</Tabs.TriggerList>

		{#each tabIds as id}
			<Tabs.Content class="[hidden]:hidden" value={id}>
				{id}
			</Tabs.Content>
		{/each}
	{/snippet}
</Tabs.Root>

<h2>Only use the root, builder instance for the rest</h2>

<Tabs.Root value="Tab 2">
	{#snippet children(tabs)}
		{tabs.value}
		<div class="flex items-center gap-2" {...tabs.triggerList}>
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
	{/snippet}
</Tabs.Root>

<h2>With options</h2>

<label>
	<input type="checkbox" bind:checked={selectWhenFocused} />
	select when focused
</label>
<br />
<label>
	<input type="checkbox" bind:checked={loop} />
	loop
</label>

<Tabs.Root value="Tab 2" {selectWhenFocused} {loop}>
	{#snippet children(tabs)}
		<div class="flex items-center gap-2" {...tabs.triggerList}>
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
	{/snippet}
</Tabs.Root>

<h2>Builder with options (syncs with above)</h2>

<div class="flex items-center gap-2" {...withOptions.triggerList}>
	{#each tabIds as id}
		<button class="!m-0 hover:opacity-75 data-[active]:font-bold" {...withOptions.getTrigger(id)}>
			{id}
		</button>
	{/each}
</div>

{#each tabIds as id}
	<div {...withOptions.getContent(id)} class="[hidden]:hidden">
		{id}
	</div>
{/each}
