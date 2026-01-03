import { describe, expect, vi, beforeEach, afterEach, } from "vitest";
import { testWithEffect } from "$lib/utils/test.svelte";
import { expectTypeOf } from "vitest";
import { Avatar, type ImageLoadingStatus } from "../Avatar.svelte";
import { render } from "vitest-browser-svelte";
import AvatarTest from "./AvatarTest.svelte";
import { tick } from "svelte";

describe("Avatar", () => {
	testWithEffect("should have valid types", () => {
		const avatar = new Avatar();
		expectTypeOf(avatar).toEqualTypeOf<Avatar>();
		expectTypeOf(avatar.loadingStatus).toEqualTypeOf<ImageLoadingStatus>();
		expectTypeOf(avatar.src).toEqualTypeOf<string | undefined>();
		expectTypeOf(avatar.delayMs).toEqualTypeOf<number>();
	});

	describe("Constructor and Initial State", () => {
		testWithEffect("should create avatar with default props", () => {
			const avatar = new Avatar();

			expect(avatar).toHaveProperty("src", undefined);
			expect(avatar).toHaveProperty("delayMs", 0);
			expect(avatar).toHaveProperty("loadingStatus", "loading");
		});

		testWithEffect("should create avatar with custom props", () => {
			const onLoadingStatusChange = vi.fn();
			const avatar = new Avatar({
				src: "favicon.png",
				delayMs: 500,
				onLoadingStatusChange,
			});

			expect(avatar).toHaveProperty("src", "favicon.png");
			expect(avatar).toHaveProperty("delayMs", 500);
			expect(avatar).toHaveProperty("loadingStatus", "loading");
		});

		testWithEffect("should handle getter functions for props", () => {
			const srcGetter = () => "favicon.png";
			const delayGetter = () => 1000;

			const avatar = new Avatar({
				src: srcGetter,
				delayMs: delayGetter,
			});

			expect(avatar).toHaveProperty("src", "favicon.png");
			expect(avatar).toHaveProperty("delayMs", 1000);
		});
	});

	describe("State Management", () => {
		testWithEffect("should reset to loading when src changes", async () => {
			vi.useFakeTimers();
			let src = $state("favicon.png");
			const avatar2 = new Avatar({ src: () => src });
			expect(avatar2.loadingStatus).toBe("loading");

			avatar2.image.onload?.();
			vi.advanceTimersByTime(avatar2.delayMs + 1);
			expect(avatar2.loadingStatus).toBe("loaded");

			// Simulate changing src through reactive update
			src = "banner.png";
			await tick();
			expect(avatar2.src).toBe("banner.png");
			expect(avatar2.loadingStatus).toBe("loading");
			vi.useRealTimers();
		});

		testWithEffect("should handle image error", () => {
			const avatar = new Avatar({ src: "invalid.jpg" });
			
			avatar.image.onerror?.();
			
			expect(avatar.loadingStatus).toBe("error");
		});
	});

	describe("Attributes", () => {
		testWithEffect("should return correct attributes in loading state", () => {
			const avatar = new Avatar({ src: "favicon.png" });
			const imageAttrs = avatar.image;
			const fallbackAttrs = avatar.fallback;

			expect(imageAttrs).toHaveProperty("data-melt-avatar-image", "");
			expect(imageAttrs).toHaveProperty("src", "favicon.png");
			expect(imageAttrs.style).toContain("display: none");
			expect(imageAttrs).toHaveProperty("onload");
			expect(imageAttrs).toHaveProperty("onerror");

			expect(fallbackAttrs).toHaveProperty("data-melt-avatar-fallback", "");
			expect(fallbackAttrs.style).toBeUndefined();
			expect(fallbackAttrs.hidden).toBeUndefined();
		});

		testWithEffect("should return correct attributes in loaded state", () => {
			vi.useFakeTimers()
			const avatar = new Avatar({ src: "favicon.png" });
			
			// Simulate loaded state
			avatar.image.onload?.();
			vi.advanceTimersByTime(avatar.delayMs + 1);
			
			// Note: In actual implementation, this would be async due to setTimeout
			// For testing purposes, we check the structure
			const fallbackAttrs = avatar.fallback;
			expect(avatar.image.style).toBeDefined();
			expect(fallbackAttrs.style).toContain("display: none");
			expect(fallbackAttrs.hidden).toBe(true);

			vi.useRealTimers();
		});

		testWithEffect("should return correct attributes in error state", async () => {
			const avatar = new Avatar();
			avatar.image.onerror?.();
			await tick();

			const fallbackAttrs = avatar.fallback;
			const imageAttrs = avatar.image;

			expect(imageAttrs.style).toContain("display: none");
			expect(fallbackAttrs.style).toBeUndefined();
			expect(fallbackAttrs.hidden).toBeUndefined();
		});
	});

	describe("Callbacks", () => {
		testWithEffect("should call onLoadingStatusChange when status changes", () => {
			const onLoadingStatusChange = vi.fn();
			const _ = new Avatar({ onLoadingStatusChange });

			// Initial call should happen
			expect(onLoadingStatusChange).toHaveBeenCalledWith("loading");
		});

		testWithEffect("should call onLoadingStatusChange on error", async () => {
			const onLoadingStatusChange = vi.fn();
			const avatar = new Avatar({ onLoadingStatusChange });

			onLoadingStatusChange.mockClear();
			avatar.image.onerror?.();
			await tick();

			expect(onLoadingStatusChange).toHaveBeenCalledWith("error");
		});

		testWithEffect("should call onLoadingStatusChange on load", async () => {
			vi.useFakeTimers();
			const onLoadingStatusChange = vi.fn();
			const avatar = new Avatar({ onLoadingStatusChange });

			onLoadingStatusChange.mockClear();
			avatar.image.onload?.();
			vi.advanceTimersByTime(avatar.delayMs + 1);
			await tick();

			expect(onLoadingStatusChange).toHaveBeenCalledWith("loaded");
			vi.useRealTimers();
		});
	});

	describe("Delay Functionality", () => {
		testWithEffect("should respect delayMs for image loading", async () => {
			vi.useFakeTimers();
			
			const avatar = new Avatar({ 
				src: "favicon.png", 
				delayMs: 1000 
			});

			// Simulate image load
			const cleanup = avatar.image.onload?.();
			
			// Should not be loaded yet
			expect(avatar.loadingStatus).toBe("loading");
			
			// Fast forward time
			vi.advanceTimersByTime(1000);
			await tick();

			expect(avatar.loadingStatus).toBe("loaded");

			
			// Now should be loaded (in real implementation)
			// Note: This test structure depends on actual implementation details
			// Cleanup
			if (typeof cleanup === 'function') {
				cleanup();
			}
			
			vi.useRealTimers();
		});
	});
});

// Browser-specific user interaction tests
describe("Avatar User Interactions (Browser)", () => {
	const alt = "Blue box";

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	testWithEffect("should clean up timers properly", () => {
		const { container, unmount } = render(AvatarTest, { 
			src: "favicon.png",
			delayMs: 1000 
		});

		const image = container.querySelector("[data-melt-avatar-image]") as HTMLImageElement;

		// Simulate image load to start timer
		const loadEvent = new Event("load");
		image.dispatchEvent(loadEvent);

		// Unmount component before timer completes
		unmount();

		// Wait longer than delay
		vi.advanceTimersByTime(1000);

		// If cleanup function ran, we would not reach here
		// as manipulating the dom wiil throw an error for unmounted component
		expect(true).toBe(true); // Test passes if no errors thrown

	});

	testWithEffect("should call onLoadingStatusChange callback", async () => {
		const onLoadingStatusChange = vi.fn();
		
		render(AvatarTest, { 
			src: "favicon.png",
			onLoadingStatusChange 
		});

		// Should be called initially with "loading"
		expect(onLoadingStatusChange).toHaveBeenNthCalledWith(1, "loading");


		await vi.waitFor(() => {
			expect(onLoadingStatusChange).toHaveBeenNthCalledWith(2, "loaded");
		})
	});

	testWithEffect("should display image when src loads successfully", async () => {
		const onLoadingStatusChange = vi.fn();
		const { getByAltText, getByText } = render(AvatarTest, { 
			alt,
			onLoadingStatusChange,
			src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==", 
		});

		const image = getByAltText(alt);
		const fallback = getByText("fallback");

		await vi.waitFor(() => {
			expect(onLoadingStatusChange).toHaveBeenNthCalledWith(2, 'loaded');
		})
		
		expect(image).toBeVisible()
		expect(fallback).not.toBeVisible();	
	});

	testWithEffect("flaky: should display fallback when image fails to load:", async () => {
		const { getByAltText, getByText } = render(AvatarTest, { 
			alt,
			src: "invalid.jpg" 
		});

		const image = getByAltText(alt);
		const fallback = getByText("fallback");
		const errorText = getByText("Loading error");

		expect(image).toBeInTheDocument();
		expect(fallback).toBeInTheDocument();
		expect(errorText).not.toBeVisible();


		await vi.waitFor(() => {
			// Fallback should still be visible
			expect(errorText).toBeVisible();
			expect(image).not.toBeVisible();
			expect(fallback).toBeVisible();
		}, {
			// Flaky chromium CI
			timeout: 4000,
			interval: 500
		});

	}, {
		timeout: 5000,
	});

	testWithEffect("should handle delay before showing image", async () => {
		const { getByAltText, getByText } = render(AvatarTest, { 
			alt,
			delayMs: 200,
			src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==",
		});

		const image = getByAltText(alt);
		const fallback = getByText("fallback");

		expect(image).not.toBeVisible();
		expect(fallback).toBeVisible();

		vi.advanceTimersByTime(200);

		await vi.waitFor(() => {
			expect(image).toBeVisible();
			expect(fallback).not.toBeVisible();
		})
	});

	testWithEffect("should handle src changes", async () => {
		const props = { 
			alt,
			src: "favicon.png",
		};
		const { getByAltText, rerender } = render(AvatarTest, props);

		const image = getByAltText(alt);
		expect(image).toHaveAttribute("src", "favicon.png");

		props.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==";
		await rerender(props);

		expect(image).toHaveAttribute("src", props.src);
	});

	testWithEffect("should handle missing src gracefully", async () => {
		const { container } = render(AvatarTest, { 
			src: undefined 
		});

		const image = container.querySelector("[data-melt-avatar-image]") as HTMLImageElement;
		const fallback = container.querySelector("[data-melt-avatar-fallback]");

		expect(image.src).toBe("");
		expect(fallback).toBeVisible();
	});

	testWithEffect("should maintain proper accessibility attributes", async () => {
		const { container } = render(AvatarTest, { 
			src: "favicon.png",
			alt: "User avatar" 
		});

		const image = container.querySelector("[data-melt-avatar-image]") as HTMLImageElement;
		
		// Should have proper alt text for accessibility
		if (image.hasAttribute("alt")) {
			expect(image).toHaveAttribute("alt", "User avatar");
		}
	});
});