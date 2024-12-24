<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { Popover as PopoverComponent } from "melt/components";
	import { Popover } from "melt/builders";

	const popover = new Popover({
		forceVisible: true,
	});
</script>

<Preview>
	<button
		class="mx-auto block rounded-xl bg-gray-100 px-4 py-2 text-gray-800
				transition-all hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		{...popover.trigger}
	>
		psst...
	</button>

	<div class="w-[260px] rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800" {...popover.content}>
		<p class="text-center font-semibold">Can I tell you a secret?</p>

		<div class="mt-4 flex items-center justify-center gap-4">
			<PopoverComponent forceVisible>
				{#snippet children(popover2)}
					<button
						class="border-b-2 border-dashed bg-transparent transition-all hover:cursor-pointer hover:opacity-75 active:opacity-50"
						{...popover2.trigger}
					>
						yes
					</button>

					<div {...popover2.content} class="rounded-xl bg-gray-100 p-4 shadow-xl backdrop-blur dark:bg-gray-700">
						you're awesome
					</div>
				{/snippet}
			</PopoverComponent>
		</div>
	</div>
</Preview>

<style>
	[data-melt-popover-content] {
		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.9);

		transition: 0.3s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, center);
	}

	[data-melt-popover-content][data-open] {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
</style>
