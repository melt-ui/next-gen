<script lang="ts">
	import NumberFlow from "@number-flow/svelte";
	import Preview from "@components/preview.svelte";
	import {  } from "svelte";
	import { Progress } from "melt/builders";
	import { Spring } from "svelte/motion";

	const spring = new Spring(50, {
		damping: 5,
	});
	const progress = new Progress({
		value: () => spring.current,
	});
	const value = $derived(Math.round(progress.value));

	function scaleConvert(value: number, from: [number, number], to: [number, number]) {
		const [minA, maxA] = from;
		const [minB, maxB] = to;
		return ((value - minA) / (maxA - minA)) * (maxB - minB) + minB;
	}

	function clamp(min: number, value: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	$effect(() => {
		progress.value = scaleConvert(value, [0, 100], [1, 0]);
	});

	$effect(() => {
		progress.value = scaleConvert(spring.current, [0, 100], [1, 0]);
	});

	$effect(() => {
		const interval = setInterval(() => {
			spring.target = Math.round(Math.random() * 100);
		}, 3000);

		return () => {
			clearInterval(interval);
		};
	});

	$effect(() => {
		const observer = new MutationObserver((records) => {
			const htmlEl = records[0].target;

			if (htmlEl instanceof HTMLElement) {
				theme = htmlEl.dataset.theme ?? "light";
			}
		});

		const el = document.getElementsByTagName("html")[0];
		observer.observe(el, { attributes: true });

		return () => {
			observer.disconnect();
		}
	});

	let theme = $state(document ? document.getElementsByTagName("html")[0].dataset.theme ?? "light" : "dark");

	const h = 34;
	const maxS = 81.01;
	const s = $derived(Math.min(scaleConvert(value, [0, 60], [0, maxS]), maxS));
	let minL = $derived(theme === "dark" ? 65.1 : 100);
	let maxL = $derived(theme === "dark" ? 100 : 65.1);
	const l = $derived(clamp(minL, scaleConvert(value, [0, 80], [maxL, minL]), maxL));
	const color = $derived(`hsl(${h}, ${s}%, ${l}%)`);
</script>

<Preview class="place-content-center">
	<div class="flex flex-col items-center gap-2">
		<span class="origin-bottom" style:scale={scaleConvert(value, [0, 100], [1, 2])} style:color>
			<NumberFlow {value} suffix="%" class="font-semibold" />
		</span>
		<div
			{...progress.root}
			class="relative w-[300px] overflow-hidden rounded-full dark:bg-neutral-700 bg-neutral-500"
			style:height={`${scaleConvert(value, [0, 100], [8, 24])}px`}
		>
			<div
				{...progress.progress}
				class="h-full w-full -translate-x-[var(--progress)]"
				style:background-color={color}
			></div>
		</div>
	</div>
</Preview>
