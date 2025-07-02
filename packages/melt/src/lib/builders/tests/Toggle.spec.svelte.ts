import { describe, expect, vi, beforeEach } from "vitest";
import { testKbd, testWithEffect } from "$lib/utils/test.svelte";
import { expectTypeOf } from "vitest";
import { Toggle } from "../Toggle.svelte";
import { render } from "vitest-browser-svelte";
import ToggleTest from "./ToggleTest.svelte";
import { tick } from "svelte";
import { userEvent, type UserEvent } from "@vitest/browser/context";

describe("Toggle", () => {
	testWithEffect("should have valid types", () => {
		const toggle = new Toggle();
		expectTypeOf(toggle).toEqualTypeOf<Toggle>();
		expectTypeOf(toggle.value).toEqualTypeOf<boolean>();
		expectTypeOf(toggle.disabled).toEqualTypeOf<boolean>();
	});

	describe("Constructor and Initial State", () => {
		testWithEffect("should create toggle with default props", () => {
			const toggle = new Toggle();
			expect(toggle.value).toBe(false);
			expect(toggle.disabled).toBe(false);
		});

		testWithEffect("should create toggle with custom props", () => {
			const onValueChange = vi.fn();
			const toggle = new Toggle({
				value: true,
				disabled: true,
				onValueChange,
			});

			expect(toggle.value).toBe(true);
			expect(toggle.disabled).toBe(true);
		});

		testWithEffect("should handle getter functions for props", () => {
			const valueGetter = () => true;
			const disabledGetter = () => true;

			const toggle = new Toggle({
				value: valueGetter,
				disabled: disabledGetter,
			});

			expect(toggle.value).toBe(true);
			expect(toggle.disabled).toBe(true);
		});
	});

	describe("Value Management", () => {
		testWithEffect("should update value when setting directly", () => {
			const toggle = new Toggle();
			toggle.value = true;
			expect(toggle.value).toBe(true);
		});

		testWithEffect("should call onValueChange when value changes", () => {
			const onValueChange = vi.fn();
			const toggle = new Toggle({ onValueChange });
			toggle.value = true;
			expect(onValueChange).toHaveBeenCalledWith(true);
		});

		testWithEffect("should update disabled when changed via prop", () => {
			let disabled = $state(false);
			const toggle = new Toggle({ disabled: () => disabled });
			expect(toggle.disabled).toBe(false);
			disabled = true;
			expect(toggle.disabled).toBe(true);
		});
	});

	describe("Attributes", () => {
		testWithEffect("should return correct trigger & hidden attributes", () => {
			const toggle = new Toggle();
			const triggerAttrs = toggle.trigger;

			expect(triggerAttrs["data-melt-toggle-trigger"]).toBe("");
			expect(triggerAttrs["data-checked"]).toBe(undefined);
			expect(triggerAttrs["aria-pressed"]).toBe(false);
			expect(triggerAttrs.disabled).toBe(undefined);
			expect(triggerAttrs.onclick).toBeDefined();

			const inputAttrs = toggle.hiddenInput;

			expect(inputAttrs["data-melt-toggle-hidden-input"]).toBe("");
			expect(inputAttrs.type).toBe("hidden");
			expect(inputAttrs.value).toBe("off");
		});
	});

	describe("Browser Integration", () => {
		let user: UserEvent;

		beforeEach(() => {
			user = userEvent.setup();
		});

		testWithEffect("should render with correct ARIA attributes", () => {
			const { getByTestId } = render(ToggleTest, {
				label: "Test Toggle",
			});

			const button = getByTestId("toggle-button");
			expect(button).toHaveAttribute("aria-pressed", "false");
			expect(button).not.toHaveAttribute("data-checked");
		});

		testWithEffect("should handle click events", async () => {
			const onValueChange = vi.fn();
			const { getByTestId } = render(ToggleTest, {
				onValueChange,
			});

			const button = getByTestId("toggle-button");
			await button.click();
			await tick();

			expect(onValueChange).toHaveBeenCalledWith(true);
			expect(button).toHaveAttribute("aria-pressed", "true");
			expect(button).toHaveAttribute("data-checked", "");
		});

		testWithEffect("should respect disabled state", async () => {
			const onValueChange = vi.fn();
			const { getByTestId } = render(ToggleTest, {
				disabled: true,
				onValueChange,
			});

			const button = getByTestId("toggle-button");
			// Disabled click assertion
			await expect(user.click(button, { timeout: 100 })).rejects.toThrow();

			expect(onValueChange).not.toHaveBeenCalled();
			expect(button).toBeDisabled();
		});

		testWithEffect("should sync hidden input value", async () => {
			const { getByTestId, container } = render(ToggleTest);
			const button = getByTestId("toggle-button");
			const input = container.querySelector("input[type='hidden']") as HTMLInputElement;

			expect(input.value).toBe("off");

			await button.click();
			await tick();

			expect(input.value).toBe("on");
		});

		testWithEffect("should handle keyboard interactions", async () => {
			const { getByTestId } = render(ToggleTest);
			const button = getByTestId("toggle-button");

			// Test Space key toggles state
			await user.keyboard(testKbd.TAB + testKbd.SPACE);

			expect(button).toHaveAttribute("aria-pressed", "true");

			// Test Enter key toggles state
			await user.keyboard(testKbd.ENTER);

			expect(button).toHaveAttribute("aria-pressed", "false");
		});

		testWithEffect("should maintain focus state", async () => {
			const { getByTestId } = render(ToggleTest);
			const button = getByTestId("toggle-button");

			await user.keyboard(testKbd.TAB);
			await tick();

			expect(button.element()).toBe(document.activeElement);
			
			await button.click();
			await tick();
			
			expect(button.element()).toBe(document.activeElement);
		});

		testWithEffect("should update state when props change", async () => {
			const props = {
				value: false,
				label: "Mute",
			};

			const { getByTestId, rerender } = render(ToggleTest, props);
			const button = getByTestId("toggle-button");

			expect(button).toHaveAttribute("aria-pressed", "false");

			props.value = true;
			await rerender(props);

			expect(button).toHaveAttribute("aria-pressed", "true");
		});
	});
});
