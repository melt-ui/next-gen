import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { testKbd, testWithEffect } from "$lib/utils/test.svelte";
import { expectTypeOf } from "vitest";
import { SvelteSet } from "svelte/reactivity";
import { Accordion } from "../Accordion.svelte";
import { page, userEvent, type UserEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-svelte";
import AccordionTest from "./AccordionTest.svelte";
// import { axe } from 'vitest-axe';

describe("Accordion", () => {
	testWithEffect("should have valid types", () => {
		const a1 = new Accordion();
		expectTypeOf(a1).toExtend<{ value: string | undefined }>();

		const a2 = new Accordion({ multiple: true });
		expectTypeOf(a2).toExtend<{ value: SvelteSet<string> }>();
	});

	describe("Constructor and Initial State", () => {
		testWithEffect("should create accordion with default props", () => {
			const accordion = new Accordion();

			expect(accordion.multiple).toBe(false);
			expect(accordion.disabled).toBe(false);
			expect(accordion.ids).toBeDefined();
			expect(accordion.ids.root).toBeDefined();
		});

		testWithEffect("should create accordion with custom props", () => {
			const onValueChange = vi.fn();
			const accordion = new Accordion({
				multiple: true,
				disabled: true,
				value: new Set(["item1"]),
				onValueChange,
			});

			expect(accordion.multiple).toBe(true);
			expect(accordion.disabled).toBe(true);
		});

		testWithEffect("should handle getter functions for props", () => {
			const multipleGetter = () => true;
			const disabledGetter = () => false;

			const accordion = new Accordion({
				multiple: multipleGetter,
				disabled: disabledGetter,
			});

			expect(accordion.multiple).toBe(true);
			expect(accordion.disabled).toBe(false);
		});
	});

	describe("State Management", () => {
		let accordion: Accordion<false>;
		let multipleAccordion: Accordion<true>;
		let cleanupEffect: () => void;

		beforeEach(() => {
			cleanupEffect = $effect.root(() => {
				accordion = new Accordion();
				multipleAccordion = new Accordion({ multiple: true });
			});
		});

		afterEach(() => {
			cleanupEffect();
		});

		it("should check if item is expanded", () => {
			expect(accordion.isExpanded("item1")).toBe(false);
			accordion.expand("item1");
			expect(accordion.isExpanded("item1")).toBe(true);
		});

		it("should expand an item", () => {
			accordion.expand("item1");
			expect(accordion.isExpanded("item1")).toBe(true);
		});

		it("should collapse an item", () => {
			accordion.expand("item1");
			accordion.collapse("item1");
			expect(accordion.isExpanded("item1")).toBe(false);
		});

		it("should toggle item expansion", () => {
			expect(accordion.isExpanded("item1")).toBe(false);

			accordion.toggleExpanded("item1");
			expect(accordion.isExpanded("item1")).toBe(true);

			accordion.toggleExpanded("item1");
			expect(accordion.isExpanded("item1")).toBe(false);
		});

		it("should handle single selection mode correctly", () => {
			accordion.expand("item1");
			accordion.expand("item2");

			expect(accordion.isExpanded("item1")).toBe(false);
			expect(accordion.isExpanded("item2")).toBe(true);
		});

		it("should handle multiple selection mode correctly", () => {
			multipleAccordion.expand("item1");
			multipleAccordion.expand("item2");

			expect(multipleAccordion.isExpanded("item1")).toBe(true);
			expect(multipleAccordion.isExpanded("item2")).toBe(true);
		});

		it("should clear previous selection when toggling in single mode", () => {
			accordion.expand("item1");
			accordion.toggleExpanded("item2");

			expect(accordion.isExpanded("item1")).toBe(false);
			expect(accordion.isExpanded("item2")).toBe(true);
		});
	});

	describe("Attributes", () => {
		testWithEffect("should return correct root attributes", () => {
			const accordion = new Accordion();
			const rootAttrs = accordion.root;

			expect(rootAttrs).toHaveProperty("id");
			expect(rootAttrs.id).toBe(accordion.ids.root);
			expect(rootAttrs).toHaveProperty("data-melt-accordion-root", "");
		});
	});

	describe("Accordion Item Creation", () => {
		testWithEffect("should create accordion item with correct properties", () => {
			const accordion = new Accordion();
			const itemMeta = {
				id: "test-item",
				disabled: false,
				headingLevel: 2 as const,
			};

			const item = accordion.getItem(itemMeta);

			expect(item).toBeDefined();
			expect(item.item).toEqual(itemMeta);
			expect(item.isDisabled).toBe(false);
			expect(item.isExpanded).toBe(false);
		});
	});

	describe("Props and Callbacks", () => {
		testWithEffect("should call onValueChange when value changes", () => {
			const onValueChange = vi.fn();
			const accordion = new Accordion({ onValueChange });

			accordion.expand("item1");

			expect(onValueChange).toHaveBeenCalled();
		});
	});
});

describe("AccordionItem", () => {
	let accordion: Accordion<false>;
	let item: ReturnType<Accordion["getItem"]>;
	let cleanupEffect: () => void;

	beforeEach(() => {
		cleanupEffect = $effect.root(() => {
			accordion = new Accordion();
			const itemMeta = {
				id: "test-item",
				disabled: false,
				headingLevel: 2 as const,
			};
			item = accordion.getItem(itemMeta);
		});
	});

	afterEach(() => {
		cleanupEffect();
	});

	describe("State Management", () => {
		testWithEffect("should reflect accordion disabled state", () => {
			const disabledAccordion = new Accordion({ disabled: true });
			const disabledItem = disabledAccordion.getItem({ id: "test", disabled: false });

			expect(disabledItem.isDisabled).toBe(true);
			expect(disabledItem.trigger["aria-disabled"]).toBe(true);
			expect(disabledItem.trigger.disabled).toBe(true);
		});

		testWithEffect("should reflect item disabled state", () => {
			const enabledAccordion = new Accordion();
			const disabledItem = enabledAccordion.getItem({ id: "test", disabled: true });

			expect(disabledItem.isDisabled).toBe(true);
			expect(disabledItem.trigger["aria-disabled"]).toBe(true);
			expect(disabledItem.trigger.disabled).toBe(true);
		});
	});

	describe("Methods", () => {
		testWithEffect("should expand item", () => {
			expect(item.trigger["aria-expanded"]).toBe(false);
			expect(item.trigger["data-state"]).toBe("closed");
			expect(accordion.isExpanded("test-item")).toBe(false);

			item.expand();

			expect(item.trigger["aria-expanded"]).toBe(true);
			expect(item.trigger["data-state"]).toBe("open");
			expect(accordion.isExpanded("test-item")).toBe(true);
			expect(item.isExpanded).toBe(true);
		});

		testWithEffect("should collapse item", () => {
			expect(accordion.isExpanded("test-item")).toBe(false);
			item.expand();
			expect(accordion.isExpanded("test-item")).toBe(true);
			item.collapse();
			expect(accordion.isExpanded("test-item")).toBe(false);
			expect(item.trigger["aria-expanded"]).toBe(false);
			expect(item.trigger["data-state"]).toBe("closed");
		});

		testWithEffect("should toggle expansion", () => {

			expect(accordion.isExpanded("test-item")).toBe(false);
			item.toggleExpanded();
			expect(accordion.isExpanded("test-item")).toBe(true);
			item.toggleExpanded();
			expect(accordion.isExpanded("test-item")).toBe(false);
			expect(item.trigger["aria-expanded"]).toBe(false);
			expect(item.trigger["data-state"]).toBe("closed");
		});
	});

	describe("Heading Attributes", () => {
		testWithEffect("should return correct heading attributes", () => {
			const headingAttrs = item.heading;

			expect(headingAttrs).toHaveProperty("role", "heading");
			expect(headingAttrs).toHaveProperty("aria-level", 2);
			expect(headingAttrs).toHaveProperty("data-heading-level", 2);
			expect(headingAttrs).toHaveProperty("data-melt-accordion-heading", "");
		});

		testWithEffect("should handle undefined heading level", () => {
			const itemWithoutLevel = accordion.getItem({ id: "test-2" });
			const headingAttrs = itemWithoutLevel.heading;

			expect(headingAttrs["aria-level"]).toBeUndefined();
			expect(headingAttrs["data-heading-level"]).toBeUndefined();
		});
	});

	describe("Trigger Attributes", () => {
		testWithEffect("should return correct trigger attributes", () => {

			expect(item.trigger).toHaveProperty("data-melt-accordion-trigger", "");
			expect(item.trigger).toHaveProperty("aria-disabled", false);
			expect(item.trigger).toHaveProperty("aria-expanded", false);
			expect(item.trigger).toHaveProperty("data-value", "test-item");
			expect(item.trigger).toHaveProperty("data-state", "closed");
			expect(item.trigger).toHaveProperty("onclick");
			expect(item.trigger).toHaveProperty("onkeydown");
		});

		testWithEffect("should handle click events", () => {
			const spy = vi.spyOn(item, "toggleExpanded");

			item.trigger.onclick();

			expect(spy).toHaveBeenCalled();
		});
	});

	describe("Content Attributes", () => {
		testWithEffect("should return correct content attributes", () => {
			const contentAttrs = item.content;

			expect(contentAttrs).toHaveProperty("data-melt-accordion-content", "");
			expect(contentAttrs).toHaveProperty("data-state", "closed");
			expect(contentAttrs).toHaveProperty("data-value", "test-item");
		});
	});
});

// Browser-specific user interaction tests
describe("Accordion User Interactions (Browser)", () => {
	let user: UserEvent;
	const items: { id: string; title: string; description: string }[] = [
		{
			id: "test1",
			title: "Title 1",
			description: "Description 1",
		},
		{
			id: "test2",
			title: "Title 2",
			description: "Description 2",
		},
		{
			id: "test3",
			title: "Item 3",
			description: "Description 3",
		},
	];

	beforeEach(() => {
		user = userEvent.setup();
		document.body.innerHTML = "";
	});

	// testWithEffect('has no accessibility violations', async () => {
	//   const accordion = new Accordion();
	//   const { container } = createAccordionDOM(accordion, items);

	// 	expect((await axe(container)).violations).toEqual([]);
	// });

	testWithEffect("should handle click interactions", async () => {
		const { container } = render(AccordionTest, { items });

		// Initially nothing should be expanded
		const element = container.querySelector("[data-melt-accordion-content]");
		expect(element).toBeNull();

		const buttons = page.getByRole("button");

		const allButtons = await buttons.all();
		expect(allButtons.length).toEqual(3);
		// Click first item
		await allButtons[0]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "open");
		expect(allButtons[1]).toHaveAttribute("data-state", "closed");

		// Click second item (should close first in single mode)
		await allButtons[1]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "closed");
		expect(allButtons[1]).toHaveAttribute("data-state", "open");

		// Click second item again to close
		await allButtons[1]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "closed");
		expect(allButtons[1]).toHaveAttribute("data-state", "closed");
	});

	testWithEffect("should handle multiple selection mode", async () => {
		const { getByRole } = render(AccordionTest, { items, multiple: true });

		const buttons = getByRole("button");
		const allButtons = await buttons.all();

		// Click multiple items
		await allButtons[0]?.click();
		await allButtons[1]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "open");
		expect(allButtons[1]).toHaveAttribute("data-state", "open");
		expect(allButtons[2]).toHaveAttribute("data-state", "closed");

		// Click third item
		await allButtons[2]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "open");
		expect(allButtons[1]).toHaveAttribute("data-state", "open");
		expect(allButtons[2]).toHaveAttribute("data-state", "open");

		// Close first item
		await allButtons[0]?.click();
		expect(allButtons[0]).toHaveAttribute("data-state", "closed");
		expect(allButtons[1]).toHaveAttribute("data-state", "open");
		expect(allButtons[2]).toHaveAttribute("data-state", "open");
	});

	testWithEffect("should handle keyboard interactions", async () => {
		const { getByRole } = render(AccordionTest, { items: items.slice(0, 1) });

		const button = getByRole("button");

		// Focus the trigger
		(button.element() as HTMLButtonElement)?.focus();
		expect(document.activeElement).toBe(button.element());
		expect(button).toHaveAttribute("data-state", "closed");

		// Test Space key
		await user.keyboard(testKbd.SPACE);
		expect(button).toHaveAttribute("data-state", "open");

		// Test Space key again to close
		await user.keyboard(testKbd.SPACE);
		expect(button).toHaveAttribute("data-state", "closed");

		// Test Enter key
		await user.keyboard(testKbd.ENTER);
		expect(button).toHaveAttribute("data-state", "open");
	});

	testWithEffect("should handle disabled state", async () => {
		const { container, getByRole } = render(AccordionTest, {
			items: items.map((value) => ({
				...value,
				disabled: true,
			})),
		});

		const element = container.querySelector("[aria-disabled=true]");
		const allButtons = getByRole("button").all();
		expect(element).toBeVisible();

		allButtons.forEach((button) => {
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute("data-state", "closed");
		});

		(allButtons[0]?.element() as HTMLButtonElement)?.focus();
		await user.keyboard(testKbd.SPACE);
		expect(allButtons[0]).toHaveAttribute("data-state", "closed");
	});

	testWithEffect("should handle accordion-level disabled state", async () => {
		const { getByRole } = render(AccordionTest, { items, disabled: true });

		const allButtons = getByRole("button").all();

		allButtons.forEach((button) => {
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute("data-state", "closed");
		});
	});

	testWithEffect("should focus on first item when pressing key home", async () => {
		const { getByRole } = render(AccordionTest, { items });

		const [trigger1, _, trigger3] = getByRole("button").all();

		(trigger3!.element() as HTMLButtonElement).focus();
		await user.keyboard(testKbd.HOME);

		// Flaky so awaits
		await expect.element(trigger1!).toHaveFocus();
		await expect.element(trigger3!).not.toHaveFocus();
	});

	testWithEffect("should focus on last item when pressing key end", async () => {
		const { getByRole } = render(AccordionTest, { items });
		const [trigger1, _, trigger3] = getByRole("button").all();

		(trigger1!.element() as HTMLButtonElement).focus();
		await user.keyboard(testKbd.END);

		// Flaky so awaits
		await expect.element(trigger3!).toHaveFocus();
		await expect.element(trigger1!).not.toHaveFocus();
	});

	testWithEffect("should maintain focus during keyboard navigation", async () => {
		const { getByRole } = render(AccordionTest, { items });

		const [trigger1, trigger2, _] = getByRole("button").all();

		await user.keyboard(testKbd.TAB);
		expect(document.activeElement).toBe(trigger1?.element());

		await user.keyboard(testKbd.ARROW_DOWN);

		expect(document.activeElement).toBe(trigger2?.element());

		await user.keyboard(testKbd.ARROW_UP);
		expect(document.activeElement).toBe(trigger1?.element());
	});

	testWithEffect("should properly update attributes when state changes", async () => {
		const { container, getByRole } = render(AccordionTest, { items });

		const [trigger1, _] = getByRole("button").all();

		expect(trigger1).toHaveAttribute("data-state", "closed");
		expect(trigger1).toHaveAttribute("aria-expanded", "false");

		await (trigger1!.element() as HTMLButtonElement).click();

		expect(trigger1).toHaveAttribute("data-state", "open");
		expect(trigger1).toHaveAttribute("aria-expanded", "true");
		const content = container.querySelector("[data-melt-accordion-content]");
		expect(content!.getAttribute("data-state")).toBe("open");
	});
});
