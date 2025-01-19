<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { scale } from "svelte/transition";
	import { RadioGroup } from "melt/components";

	const items = ["default", "comfortable", "compact"];

	let controls = usePreviewControls({
		value: {
			type: "select",
			label: "Value",
			options: items,
			defaultValue: "default",
		},
		disabled: {
			type: "boolean",
			label: "Disabled",
			defaultValue: false,
		},
		loop: {
			type: "boolean",
			label: "Loop",
			defaultValue: false,
		},
		selectWhenFocused: {
			type: "boolean",
			label: "Select when focused",
			defaultValue: true,
		},
		orientation: {
			type: "select",
			label: "Orientation",
			options: ["horizontal", "vertical"],
			defaultValue: "vertical",
		},
	});
</script>

<Preview>
	<RadioGroup {items} {...controls} bind:value={controls.value}>
		{#snippet children(group)}
			<div
				class="mx-auto flex w-fit flex-col gap-3 data-[orientation=horizontal]:flex-row"
				{...group.root}
			>
				{#each group.items as item}
					<div class="flex items-center gap-3">
						<button
							class="grid h-6 w-6 cursor-default place-items-center
							rounded-full bg-white shadow-sm hover:bg-gray-100 data-[disabled=true]:bg-gray-400"
							{...item.button}
						>
							{#if item.checked}
								<div transition:scale={{ duration: 250, opacity: 1 }} class="h-3 w-3 rounded-full bg-gray-500"></div>
							{/if}
						</button>
						<label class="font-medium capitalize leading-none text-gray-100" {...item.label}>
							{item.item}
						</label>
					</div>
				{/each}
				<input {...group.hiddenInput} />
			</div>
		{/snippet}
	</RadioGroup>
</Preview>
