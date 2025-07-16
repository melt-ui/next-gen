<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { Video } from "melt/builders";
	import Play from "~icons/lucide/play";
	import Pause from "~icons/lucide/pause";
	import Volume2 from "~icons/lucide/volume-2";
	import VolumeX from "~icons/lucide/volume-x";
	import Maximize from "~icons/lucide/maximize";
	import Minimize from "~icons/lucide/minimize";

	const controls = usePreviewControls({
		autoplay: {
			label: "Autoplay",
			type: "boolean",
			defaultValue: false,
		},
		muted: {
			label: "Muted",
			type: "boolean",
			defaultValue: false,
		},
		loop: {
			label: "Loop",
			type: "boolean",
			defaultValue: false,
		},
		keyboardControls: {
			label: "Keyboard Controls",
			type: "boolean",
			defaultValue: true,
		},
		seekStep: {
			label: "Seek Step (seconds)",
			type: "number",
			defaultValue: 10,
			min: 1,
			max: 60,
		},
		volumeStep: {
			label: "Volume Step",
			type: "number",
			defaultValue: 0.05,
			min: 0.01,
			max: 0.2,
			step: 0.01,
		},
	});

	const video = new Video({
		src: () => "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
		poster: () => "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
		preload: () => "metadata",
		...getters(controls),
	});

	let showControls = $state(false);
	let controlsTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleMouseMove() {
		showControls = true;
		clearTimeout(controlsTimeout);
		controlsTimeout = setTimeout(() => {
			if (!video.seeking) {
				showControls = false;
			}
		}, 3000);
	}

	function handleMouseLeave() {
		if (!video.seeking) {
			showControls = false;
		}
		clearTimeout(controlsTimeout);
	}
</script>

<Preview>
	<div
		{...video.root}
		class="focus-visible:ring-accent-300 group relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-black shadow-lg outline-none focus-visible:ring"
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
	>
		<video {...video.video} crossOrigin="anonymous" class="h-auto w-full" width="800" height="450"
		></video>

		<div
			{...video.controls}
			class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
			class:opacity-0={!showControls && !video.seeking}
			class:opacity-100={showControls || video.seeking}
		>
			<div class="mb-4">
				<input
					{...video.progressBar}
					class="video-progress h-1 w-full cursor-pointer appearance-none rounded bg-white/30 outline-none"
				/>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<button
						{...video.playButton}
						class="focus-visible:ring-accent-300 flex h-8 w-8 items-center justify-center rounded text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring"
					>
						{#if video.playing}
							<Pause class="h-3.5 w-3.5" />
						{:else}
							<Play class="ml-0.5 h-3.5 w-3.5" />
						{/if}
					</button>

					<div class="flex items-center gap-2">
						<button
							{...video.muteButton}
							class="focus-visible:ring-accent-300 flex h-8 w-8 items-center justify-center rounded text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring"
						>
							{#if video.muted || video.volume === 0}
								<VolumeX class="h-3.5 w-3.5" />
							{:else}
								<Volume2 class="h-3.5 w-3.5" />
							{/if}
						</button>
						<input
							{...video.volumeSlider}
							class="volume-slider h-1 w-20 cursor-pointer appearance-none rounded bg-white/30 outline-none"
						/>
					</div>

					<div {...video.timeDisplay} class="text-sm text-white">
						{video.formatTime(video.currentTime)} / {video.formatTime(video.duration)}
					</div>
				</div>

				<button
					{...video.fullscreenButton}
					class="focus-visible:ring-accent-300 flex h-8 w-8 items-center justify-center rounded text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring"
				>
					{#if video.fullscreen}
						<Minimize class="h-3.5 w-3.5" />
					{:else}
						<Maximize class="h-3.5 w-3.5" />
					{/if}
				</button>
			</div>
		</div>

		{#if video.loading}
			<div class="absolute inset-0 flex items-center justify-center bg-black/50">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
				></div>
			</div>
		{/if}

		{#if video.error}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
				<div class="text-center">
					<p class="mb-2 text-lg font-semibold">Error loading video</p>
					<p class="text-sm text-white/70">{video.error}</p>
				</div>
			</div>
		{/if}

		{#if video.keyboardFeedback}
			<div
				class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-4 py-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 ease-out"
				style:animation="feedbackPulse 0.2s ease-out"
			>
				<div class="text-center text-lg font-semibold">
					{video.keyboardFeedback}
				</div>
			</div>
		{/if}
	</div>
</Preview>

<style>
	.video-progress::-webkit-slider-thumb {
		appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.video-progress::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		height: 12px;
		width: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.volume-slider::-moz-range-thumb {
		height: 12px;
		width: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Progress bar styling */
	.video-progress {
		background: linear-gradient(
			to right,
			white 0%,
			white var(--progress),
			rgba(255, 255, 255, 0.3) var(--progress),
			rgba(255, 255, 255, 0.3) var(--buffered),
			rgba(255, 255, 255, 0.1) var(--buffered),
			rgba(255, 255, 255, 0.1) 100%
		);
	}

	/* Volume slider styling */
	.volume-slider {
		background: linear-gradient(
			to right,
			white 0%,
			white calc(var(--value, 1) * 100%),
			rgba(255, 255, 255, 0.3) calc(var(--value, 1) * 100%),
			rgba(255, 255, 255, 0.3) 100%
		);
	}

	@keyframes feedbackPulse {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		100% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
</style>
