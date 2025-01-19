<script lang="ts">
	import NumberFlow from "@number-flow/svelte";
	import Preview from "@components/preview.svelte";
	import { Progress } from "melt/builders";

	const progress = new Progress();
	let value = $derived(Math.round(progress.value));

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	sleep(1000).then(() => {
		const intervalId = setInterval(() => {
			if (progress.value >= 80) clearInterval(intervalId);
			else progress.value += 0.1;
		}, 10);
	});
</script>

<Preview class="place-content-center">
	<div
		{...progress.root}
		class="relative h-6 w-[300px] overflow-hidden rounded-full border border-white"
	>
		<div {...progress.progress} class="h-full w-full -translate-x-[var(--progress)] bg-white"></div>
		<span
			class="text-accent-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold"
		>
			<NumberFlow {value} suffix="%" />
		</span>
	</div>
</Preview>
