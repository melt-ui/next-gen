<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { scale } from "svelte/transition";
	import { RadioGroup } from "melt/builders";
	import { getters } from "melt/builders";
	import { usePreviewControls } from "@components/preview-ctx.svelte";

	const items = $state(["default", "comfortable", "compact"]);

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
			defaultValue: true,
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

	const group = new RadioGroup({
		...getters(controls),
		onValueChange(v) {
			controls.value = v;
		},
	});

	const isVert = $derived(group.orientation === "vertical");
</script>

<Preview>
	<div class="mx-auto flex w-fit flex-col gap-2" {...group.root}>
		<!-- svelte-ignore a11y_label_has_associated_control -- https://github.com/sveltejs/svelte/issues/15067 -->
		<label {...group.label} class="font-semibold">Layout</label>
		<div class="flex {isVert ? 'flex-col gap-1' : 'flex-row gap-3'}">
			{#each items as i}
				{@const item = group.getItem(i)}
				<div
					class="ring-accent-500 -ml-1 flex items-center gap-3 rounded p-1 outline-none focus-visible:ring
					data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
					{...item.attrs}
				>
					<div
						class="grid h-6 w-6 place-items-center
							rounded-full bg-white shadow-sm hover:bg-gray-100 data-[disabled=true]:bg-gray-400"
					>
						{#if item.checked}
							<div
								transition:scale={{ duration: 150, opacity: 1 }}
								class="bg-accent-500 h-3 w-3 rounded-full"
							></div>
						{/if}
					</div>

					<span class="font-medium capitalize leading-none dark:text-gray-100 text-gray-600">
						{i}
					</span>
				</div>
			{/each}
		</div>
		<input {...group.hiddenInput} />
	</div>
</Preview>
