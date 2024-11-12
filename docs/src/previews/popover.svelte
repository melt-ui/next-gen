<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Popover } from "melt/components";
	import { fade } from "svelte/transition";

	const _controls = usePreviewControls({});
</script>

<Preview>
	<Popover forceVisible>
		{#snippet children(popover)}
			<button
				class="relative h-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
				{...popover.trigger}
			>
				{popover.open ? "close" : "open"} force visible
			</button>

			{#if popover.open}
				<div class="!w-[400px]" {...popover.content} transition:fade>hey</div>
			{/if}
		{/snippet}
	</Popover>

	<Popover>
		{#snippet children(popover)}
			<button
				class="relative h-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
				{...popover.trigger}
			>
				{popover.open ? "close" : "open"} non force visible
			</button>

			<div {...popover.content}>
				<p>First popover</p>
				<Popover>
					{#snippet children(popover2)}
						<button
							class="relative h-16 rounded-xl bg-transparent text-xl
							transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
						  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
							{...popover2.trigger}
						>
							{popover2.open ? "close" : "open"}
						</button>

						<div {...popover2.content}>
							Second popover

							<Popover>
								{#snippet children(popover3)}
									<button
										class="relative h-16 rounded-xl bg-transparent text-xl
							transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
						  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
										{...popover3.trigger}
									>
										{popover3.open ? "close" : "open"}
									</button>

									<div {...popover3.content}>third popover</div>
								{/snippet}
							</Popover>
						</div>
					{/snippet}
				</Popover>

				<Popover>
					{#snippet children(popover2)}
						<button
							class="relative h-16 rounded-xl bg-transparent text-xl
							transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
						  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
							{...popover2.trigger}
						>
							{popover2.open ? "close" : "open"}
						</button>

						<div {...popover2.content}>
							Second popover

							<Popover>
								{#snippet children(popover3)}
									<button
										class="relative h-16 rounded-xl bg-transparent text-xl
							transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
						  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
										{...popover3.trigger}
									>
										{popover3.open ? "close" : "open"}
									</button>

									<div {...popover3.content}>third popover</div>
								{/snippet}
							</Popover>
						</div>
					{/snippet}
				</Popover>
			</div>
		{/snippet}
	</Popover>
</Preview>

<style>
	[popover] {
		position: absolute;
		left: 50%;
		top: 50%;

		background: gray;
		border: 1px solid white;
		width: 300px;
	}

	[popover] [popover] {
		width: 400px;
		top: 40%;
	}

	[popover] [popover] [popover] {
		width: 500px;
		top: 30%;
	}
</style>
