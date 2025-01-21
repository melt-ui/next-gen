<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { scale } from "svelte/transition";
	import { RadioGroup } from "melt/builders";
	import { getters } from "melt/builders";

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

	const group = new RadioGroup({
		...getters(controls),
		onValueChange(v) {
			controls.value = v;
		},
	});
</script>

<Preview>
	<div
		class="mx-auto flex w-fit flex-col gap-2 data-[orientation=horizontal]:flex-row"
		{...group.root}
	>
		<!-- svelte-ignore a11y_label_has_associated_control -- https://github.com/sveltejs/svelte/issues/15067 -->
		<label {...group.label} class="font-semibold text-white">Layout</label>
		{#each items as i}
			{@const item = group.getItem(i)}
			<div
				class="ring-accent-500 -ml-1 flex items-center gap-3 rounded p-1 outline-none focus-visible:ring"
				{...item.attrs}
			>
				<div
					class="grid h-6 w-6 cursor-default place-items-center
							rounded-full bg-white shadow-sm hover:bg-gray-100 data-[disabled=true]:bg-gray-400"
				>
					{#if item.checked}
						<div
							transition:scale={{ duration: 150, opacity: 1 }}
							class="bg-accent-500 h-3 w-3 rounded-full"
						></div>
					{/if}
				</div>

				<span class="font-medium capitalize leading-none text-gray-100">
					{i}
				</span>
			</div>
		{/each}
		<input {...group.hiddenInput} />
	</div>
</Preview>
