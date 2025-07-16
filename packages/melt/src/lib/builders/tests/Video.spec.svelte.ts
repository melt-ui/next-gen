import { testWithEffect } from "$lib/utils/test.svelte";
import { expect, expectTypeOf } from "vitest";
import { Video } from "../Video.svelte";

testWithEffect("Should have valid types", () => {
	const player = new Video();

	// Test basic properties
	expectTypeOf(player.currentTime).toMatchTypeOf<number>();
	expectTypeOf(player.volume).toMatchTypeOf<number>();
	expectTypeOf(player.muted).toMatchTypeOf<boolean>();
	expectTypeOf(player.playing).toMatchTypeOf<boolean>();
	expectTypeOf(player.duration).toMatchTypeOf<number>();
	expectTypeOf(player.buffered).toMatchTypeOf<number>();
	expectTypeOf(player.loading).toMatchTypeOf<boolean>();
	expectTypeOf(player.fullscreen).toMatchTypeOf<boolean>();
	expectTypeOf(player.seeking).toMatchTypeOf<boolean>();
	expectTypeOf(player.progress).toMatchTypeOf<number>();
	expectTypeOf(player.bufferedProgress).toMatchTypeOf<number>();

	// Test methods
	expectTypeOf(player.play).toMatchTypeOf<() => void>();
	expectTypeOf(player.pause).toMatchTypeOf<() => void>();
	expectTypeOf(player.togglePlay).toMatchTypeOf<() => void>();
	expectTypeOf(player.seek).toMatchTypeOf<(time: number) => void>();
	expectTypeOf(player.seekBy).toMatchTypeOf<(seconds: number) => void>();
	expectTypeOf(player.setVolume).toMatchTypeOf<(volume: number) => void>();
	expectTypeOf(player.toggleMute).toMatchTypeOf<(showFeedback?: boolean) => void>();
	expectTypeOf(player.setPlaybackRate).toMatchTypeOf<(rate: number) => void>();
	expectTypeOf(player.enterFullscreen).toMatchTypeOf<() => void>();
	expectTypeOf(player.exitFullscreen).toMatchTypeOf<() => void>();
	expectTypeOf(player.toggleFullscreen).toMatchTypeOf<() => void>();
	expectTypeOf(player.formatTime).toMatchTypeOf<(seconds: number) => string>();

	// Test element getters
	expectTypeOf(player.root).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.video).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.controls).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.playButton).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.muteButton).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.volumeSlider).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.progressBar).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.timeDisplay).toMatchTypeOf<Record<string, unknown>>();
	expectTypeOf(player.fullscreenButton).toMatchTypeOf<Record<string, unknown>>();
});

testWithEffect("Should initialize with default values", () => {
	const player = new Video();

	expect(player.currentTime).toBe(0);
	expect(player.volume).toBe(1);
	expect(player.muted).toBe(false);
	expect(player.playing).toBe(false);
	expect(player.duration).toBe(0);
	expect(player.buffered).toBe(0);
	expect(player.loading).toBe(false);
	expect(player.fullscreen).toBe(false);
	expect(player.seeking).toBe(false);
	expect(player.progress).toBe(0);
	expect(player.bufferedProgress).toBe(0);
});

testWithEffect("Should accept custom props", () => {
	const player = new Video({
		currentTime: () => 30,
		volume: () => 0.5,
		muted: () => true,
		autoplay: () => true,
		loop: () => true,
		preload: () => "auto",
	});

	expect(player.currentTime).toBe(30);
	expect(player.volume).toBe(0.5);
	expect(player.muted).toBe(true);
});

testWithEffect("Should format time correctly", () => {
	const player = new Video();

	expect(player.formatTime(0)).toBe("0:00");
	expect(player.formatTime(30)).toBe("0:30");
	expect(player.formatTime(90)).toBe("1:30");
	expect(player.formatTime(3661)).toBe("1:01:01");
});

testWithEffect("Should handle volume constraints", () => {
	const player = new Video();

	player.setVolume(-1);
	expect(player.volume).toBe(0);

	player.setVolume(2);
	expect(player.volume).toBe(1);

	player.setVolume(0.5);
	expect(player.volume).toBe(0.5);
});

testWithEffect("Should handle custom keyboard control steps", () => {
	const player = new Video({
		seekStep: () => 15,
		volumeStep: () => 0.1,
	});

	expect(player.seekStep).toBe(15);
	expect(player.volumeStep).toBe(0.1);
});

testWithEffect("Should default keyboard control values", () => {
	const player = new Video();

	expect(player.seekStep).toBe(10);
	expect(player.volumeStep).toBe(0.05);
	expect(player.keyboardControls).toBe(true);
});

testWithEffect("Should allow disabling keyboard controls", () => {
	const player = new Video({
		keyboardControls: () => false,
	});

	expect(player.keyboardControls).toBe(false);
});

testWithEffect("Should handle keyboard feedback", () => {
	const player = new Video();

	// Initially no feedback
	expect(player.keyboardFeedback).toBe(null);

	// Test that feedback is accessible (actual feedback display would need DOM testing)
	expectTypeOf(player.keyboardFeedback).toMatchTypeOf<string | null>();
});
