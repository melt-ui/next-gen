<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Toggle } from "melt";
	import { spring, tweened } from "svelte/motion";
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

	const scale = spring(0, { damping: 0.105, stiffness: 0.07, precision: 0.03 });
	$effect(() => {
		scale.set(toggle.value ? 1 : 0);
	});
	const absScale = $derived(Math.max(0, $scale));
</script>

<Preview>
	<div class="flex justify-center">
		<button
			class="relative size-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
			{...toggle.trigger}
		>
			<PhHeartFill
				class="text-accent-200 absolute left-1/2 top-1/2 z-10 origin-center -translate-x-1/2 -translate-y-1/2"
				style="--tw-scale-x: {absScale}; --tw-scale-y: {absScale}; "
			/>
			<PhHeartBold
				class="absolute left-1/2 top-1/2  -translate-x-1/2 -translate-y-1/2 opacity-30"
			/>
		</button>
	</div>
</Preview>
