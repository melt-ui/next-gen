<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Video as Builder, type VideoProps } from "../builders/Video.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<VideoProps> & {
		children: Snippet<[Builder]>;
	};

	let {
		src = $bindable(),
		currentTime = $bindable(),
		volume = $bindable(),
		muted = $bindable(),
		playbackRate = $bindable(),
		keyboardControls = $bindable(),
		volumeStep = $bindable(),
		seekStep = $bindable(),
		children,
		...rest
	}: Props = $props();

	export const video = new Builder({
		src: () => src,
		currentTime: () => currentTime,
		volume: () => volume,
		muted: () => muted,
		playbackRate: () => playbackRate,
		keyboardControls: () => keyboardControls,
		volumeStep: () => volumeStep,
		seekStep: () => seekStep,
		onCurrentTimeChange: (v) => (currentTime = v),
		onVolumeChange: (v) => (volume = v),
		onMutedChange: (v) => (muted = v),
		onPlaybackRateChange: (v) => (playbackRate = v),
		...getters(rest),
	});
</script>

{@render children(video)}
