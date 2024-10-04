import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import { isHtmlElement } from "./is";
import { useEventListener } from "runed";

export type GetPopoverAttributesArgs = {
	contentId: string;
	triggerId: string;
	open: boolean;
	forceVisible?: boolean;
};

export function getPopoverTriggerAttributes(args: GetPopoverAttributesArgs) {
	return {
		id: args.triggerId,
		popovertarget: args.contentId,
		onclick: (e: Event) => {
			e.preventDefault();
			args.open = !args.open;
		},
	} satisfies HTMLButtonAttributes;
}

export function getPopoverAttributes(args: GetPopoverAttributesArgs) {
	$effect(() => {
		const el = document.getElementById(args.contentId);
		if (!isHtmlElement(el)) {
			return;
		}

		if (args.open || args.forceVisible) {
			el.showPopover();
		} else {
			el.hidePopover();
		}
	});

	useEventListener(
		() => document,
		"keydown",
		(e) => {
			const el = document.getElementById(args.contentId);
			if (e.key !== "Escape" || !args.open || !isHtmlElement(el)) return;
			e.preventDefault();
			const openPopovers = [...el.querySelectorAll("[popover]")].filter((child) => {
				return child.matches(":popover-open");
			});

			if (openPopovers.length) return;
			// Set timeout to give time to all event listeners to run
			setTimeout(() => (args.open = false));
		},
	);

	useEventListener(
		() => document,
		"click",
		(e) => {
			const contentEl = document.getElementById(args.contentId);
			const triggerEl = document.getElementById(args.triggerId);

			if (
				args.open &&
				!contentEl?.contains(e.target as Node) &&
				!triggerEl?.contains(e.target as Node)
			) {
				args.open = false;
			}
		},
	);

	return {
		id: args.contentId,
		popover: "manual",
		ontoggle: (e) => {
			const newOpen = e.newState === "open";
			if (args.open !== newOpen) {
				args.open = newOpen;
			}
		},
	} satisfies HTMLAttributes<HTMLElement>;
}
