<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { getters } from "melt";
	import { ToggleGroup } from "melt/builders";
	import PhTextALeft from "~icons/ph/text-align-left";
	import PhTextACenter from "~icons/ph/text-align-center";
	import PhTextARight from "~icons/ph/text-align-right";

	const items = $state(["left", "center", "right"]);

	const icons: Record<string, any> = {
		left: PhTextALeft,
		center: PhTextACenter,
		right: PhTextARight,
	};

	let controls = usePreviewControls({
		type: {
			type: "select",
			label: "Type",
			options: ["single", "multiple"],
			defaultValue: "single",
		},
		orientation: {
			type: "select",
			label: "Orientation",
			options: ["horizontal", "vertical"],
			defaultValue: "horizontal",
		},
		disabled: {
			type: "boolean",
			label: "Disabled",
			defaultValue: false,
		},
		required: {
			type: "boolean",
			label: "Required",
			defaultValue: true,
		},
		loop: {
			type: "boolean",
			label: "Loop",
			defaultValue: true,
		},
	});

	const toggleGroup = new ToggleGroup({
		...getters(controls),
		name: "alignment",
		defaultItem: "left",
		onValueChange: (value: string | Array<string>) => {
			console.log("Value changed:", value);
		},
	});

	const isVert = $derived(toggleGroup.orientation === "vertical");
</script>

<Preview>
	<div class=" m-auto flex w-fit flex-col">
		<div class="flex flex-col gap-2">
			<label {...toggleGroup.label} class="text-sm">Text Alignment</label>
			<div
				{...toggleGroup.root}
				class="inline-flex {isVert
					? 'flex-col'
					: 'flex-row'} w-fit gap-px overflow-hidden rounded-md p-2 shadow-sm"
			>
				{#each items as i}
					{@const item = toggleGroup.getItem(i)}
					{@const Icon = icons[i] || null}
					<button
						{...item.attrs}
						class="data-[state=on]:bg-accent-500 data-[state=on]:border-accent-500 focus-visible:ring-accent-500 dark:data-[state=on]:bg-accent-400 cursor-pointer rounded-lg border
						border-gray-200 bg-white
						px-4
						py-2
						font-medium outline-none
						transition-colors focus:z-10
						focus-visible:ring-2 focus-visible:ring-offset-2 data-[disabled=true]:cursor-not-allowed
						data-[state=on]:text-white data-[disabled=true]:opacity-50 dark:border-gray-700
						dark:bg-gray-800"
					>
						<span class="flex items-center gap-2 capitalize"
							>{#if Icon}<Icon />{/if}{i}</span
						>
					</button>
				{/each}
			</div>
		</div>

		<!-- Hidden inputs for form submission -->
		{#if toggleGroup.type === "multiple" && Array.isArray(toggleGroup.value)}
			{#each toggleGroup.value as val}
				<input type="hidden" name={toggleGroup.name} value={val} />
			{/each}
		{:else}
			<input type="hidden" name={toggleGroup.name} value={toggleGroup.value || ""} />
		{/if}

		<div class="space-y-1 text-sm">
			<p class="mt-1 text-gray-700 dark:text-gray-300">
				Current value:
				{#if toggleGroup.type === "multiple"}
					{#if Array.isArray(toggleGroup.value) && toggleGroup.value.length > 0}
						{toggleGroup.value.join(", ")}
					{:else}
						None selected
					{/if}
				{:else}
					{toggleGroup.value || "None selected"}
				{/if}
			</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{#if toggleGroup.required}
					<span class="text-red-500">*</span> At least one option must be selected
				{:else}
					All options can be deselected
				{/if}
			</p>
		</div>
	</div>
</Preview>
