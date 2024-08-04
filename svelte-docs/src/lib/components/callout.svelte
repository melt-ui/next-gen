<script lang="ts">
	import { Info, RocketLaunch, Warning, WarningOctagon } from "$lib/icons/index.js";

	export let type: "note" | "warning" | "danger" | "tip" = "note";
	export let title: string | undefined = type
		.split("")
		.map((c, i) => (i === 0 ? c.toUpperCase() : c))
		.join("");

	const iconMap = {
		note: Info,
		tip: RocketLaunch,
		warning: Warning,
		danger: WarningOctagon,
	} as const;
</script>

<div class="mt-4">
	<svelte:component this={iconMap[type]} class="size-6" weight="bold" />

	{#if title}
		<h5 class="text-lg">
			{title}
		</h5>
	{/if}

	<p class="leading-relaxed">
		<slot />
	</p>
</div>
