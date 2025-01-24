<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Toggle } from "melt/builders";
	import { spring } from "svelte/motion";
	import PhHeartBold from "~icons/ph/heart-bold";
	import PhHeartFill from "~icons/ph/heart-fill";

	const controls = usePreviewControls({
		disabled: {
			label: "Disabled",
			type: "boolean",
			defaultValue: false,
		},
	});

	const toggle = new Toggle({
		disabled: () => controls.disabled,
	});

	const scale = spring(0, { damping: 0.205, stiffness: 0.07, precision: 0.03 });
	$effect(() => {
		scale.set(toggle.value ? 1 : 0);
	});
	const absScale = $derived(Math.max(0, $scale));
</script>

<Preview>
	<div class="flex justify-center">
		<button
			class="focus-visible:ring-accent-300 relative size-16 rounded-xl bg-transparent
				text-xl outline-none transition-all hover:cursor-pointer
			  hover:bg-gray-300/25 focus-visible:ring active:bg-gray-300/40 disabled:cursor-not-allowed
				dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:disabled:bg-gray-900"
			{...toggle.trigger}
		>
			<PhHeartFill
				class="text-accent-500 dark:text-accent-200 absolute left-1/2 top-1/2 z-10 origin-center -translate-x-1/2 -translate-y-1/2"
				style="--tw-scale-x: {absScale}; --tw-scale-y: {absScale}; "
			/>
			<PhHeartBold
				class="absolute left-1/2 top-1/2  -translate-x-1/2 -translate-y-1/2 opacity-30"
			/>
		</button>
	</div>
</Preview>
