<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Collapsible } from "melt/components";
	import { slide } from "svelte/transition";
	import ChevronUpDown from "~icons/heroicons/chevron-up-down-solid";
	import Close from "~icons/material-symbols/close-rounded";

	const controls = usePreviewControls({
		disabled: {
			label: "Disabled",
			type: "boolean",
			defaultValue: false,
		},
	});
</script>

<Preview>
	<Collapsible {...controls}>
		{#snippet children(collapsible)}
			<div {...collapsible.root} class="mx-auto mb-28 w-[18rem] max-w-full sm:w-[25rem]">
				<div class="flex items-center justify-between">
					<span class="text-base font-semibold"> @thomasglopes starred 3 repositories </span>
					<button
						{...collapsible.trigger}
						class="inline-flex aspect-square items-center justify-center rounded-md bg-white text-lg text-black shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75"
						aria-label="Toggle"
					>
						{#if collapsible.open}
							<Close />
						{:else}
							<ChevronUpDown />
						{/if}
					</button>
				</div>

				{#if collapsible.open}
					<div {...collapsible.content} class="mt-6" transition:slide>
						<div class="flex flex-col gap-2">
							<div class="rounded-lg bg-white p-3 shadow">
								<span class="text-base text-black">melt-ui/melt-ui</span>
							</div>
							<div class="rounded-lg bg-white p-3 shadow">
								<span class="text-base text-black">sveltejs/svelte</span>
							</div>
							<div class="rounded-lg bg-white p-3 shadow">
								<span class="text-base text-black">sveltejs/kit</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/snippet}
	</Collapsible>
</Preview>

<style>
	.abs-center {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
</style>
