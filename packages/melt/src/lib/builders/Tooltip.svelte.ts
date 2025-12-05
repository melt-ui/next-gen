import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { isPointerInGraceArea } from "$lib/utils/pointer";
import { computeConvexHull, getPointsFromEl } from "$lib/utils/polygon";
import { autoOpenPopover, safelyHidePopover } from "$lib/utils/popover.js";
import {
	useFloating,
	type UseFloatingArgs,
	type UseFloatingConfig,
} from "$lib/utils/use-floating.svelte";
import type { ComputePositionReturn, ElementRects } from "@floating-ui/dom";
import { dequal } from "dequal";
import { useEventListener, watch } from "runed";
import { createAttachmentKey } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";
import { on } from "svelte/events";

const { createIds, dataAttrs, dataSelectors } = createBuilderMetadata("tooltip", [
	"trigger",
	"content",
	"arrow",
]);

type OpenReason = "pointer" | "focus";

export type TooltipProps = {
	/**
	 * If the Tooltip is open.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the value is supposed to change.
	 */
	onOpenChange?: (value: boolean) => void;

	/**
	 * If `true`, tooltip will close if trigger is pressed.
	 *
	 * @default true
	 */
	closeOnPointerDown?: MaybeGetter<boolean | undefined>;

	/**
	 * Tooltip open delay in milliseconds.
	 *
	 * @default 1000
	 */
	openDelay?: MaybeGetter<number | undefined>;

	/**
	 * Tooltip close delay in milliseconds.
	 *
	 * @default 0
	 */
	closeDelay?: MaybeGetter<number | undefined>;

	/**
	 * Config to be passed to `useFloating`
	 */
	floatingConfig?: UseFloatingArgs["config"];

	/**
	 * If the popover visibility should be controlled by the user.
	 *
	 * @default false
	 */
	forceVisible?: MaybeGetter<boolean | undefined>;

	/**
	 * If `true`, leaving trigger will close the tooltip.
	 *
	 * @default false
	 */
	disableHoverableContent?: MaybeGetter<boolean | undefined>;
	
	/**
	 * The ids to use for the tooltip elements.
	 */
	ids?: MaybeGetter<Partial<ReturnType<typeof createIds>> | undefined>;
};

export class Tooltip {
	invokerRect = $state<ElementRects["reference"]>();

	/** Props */
	#props!: TooltipProps;
	closeOnPointerDown = $derived(extract(this.#props.closeOnPointerDown, true));
	openDelay = $derived(extract(this.#props.openDelay, 1000));
	closeDelay = $derived(extract(this.#props.closeDelay, 0));
	disableHoverableContent = $derived(extract(this.#props.disableHoverableContent, false));
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	floatingConfig = $derived.by(() => {
		const config = extract(this.#props.floatingConfig, {} satisfies UseFloatingConfig);

		config.computePosition = {
			...config.computePosition,
			middleware: [
				...(config.computePosition?.middleware ?? []),
				{
					name: "grabInvokerRect",
					fn: ({ rects }) => {
						const prev = $state.snapshot(this.invokerRect);
						const curr = rects.reference;
						if (dequal(prev, curr)) return {};
						this.invokerRect = rects.reference;
						return {};
					},
				},
			],
		};

		return config;
	});

	/** State */
	isVisible = $derived(this.open || this.forceVisible);
	#open!: Synced<boolean>;
	#openReason: OpenReason | null = $state(null);
	#clickedTrigger: boolean = $state(false);
	#isPointerInsideTrigger: boolean = $state(false);
	#isPointerInsideContent: boolean = $state(false);
	#isMouseInTooltipArea: boolean = $state(false);
	#openTimeout: number | null = $state(null);
	#closeTimeout: number | null = $state(null);
	#floatingData = $state<ComputePositionReturn>();
	ids = $state(createIds());

	get graceAreaPolygon() {
		const contentEl = document.getElementById(this.ids.content);
		const triggerEl = document.getElementById(this.ids.trigger);
		if (!contentEl || !triggerEl) {
			return [];
		}

		const PADDING = 6;
		const [tl, tr, br, bl] = getPointsFromEl(triggerEl);
		const contentPoints = this.disableHoverableContent ? [] : getPointsFromEl(contentEl);
		const placement = this.#floatingData?.placement;

		const points = [...contentPoints];

		if (placement?.startsWith("top")) {
			points.push(tl, tr);
		} else if (placement?.startsWith("right")) {
			points.push(tr, br);
		} else if (placement?.startsWith("bottom")) {
			points.push(br, bl);
		} else {
			points.push(bl, tl);
		}

		const withPadding = points.reduce(
			(acc, point) => {
				return [
					...acc,
					{ x: point.x + PADDING, y: point.y + PADDING },
					{ x: point.x + PADDING, y: point.y - PADDING },
					{ x: point.x - PADDING, y: point.y + PADDING },
					{ x: point.x - PADDING, y: point.y - PADDING },
				];
			},
			[] as { x: number; y: number }[],
		);

		return computeConvexHull(withPadding);
	}

	constructor(props: TooltipProps = {}) {
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
		this.#props = props;
		this.ids = {
			...this.ids,
			...extract(props.ids, {})
		}

		watch([() => this.open, () => this.#openReason], () => {
			if (!this.open || typeof document === "undefined") return;

			return on(document, "mousemove", (e) => {
				const contentEl = document.getElementById(this.ids.content);
				const triggerEl = document.getElementById(this.ids.trigger);
				if (!contentEl || !triggerEl) {
					if (this.open) this.#closeTooltip();
					return;
				}

				const polygon = this.graceAreaPolygon;

				// DEBUG PURPOSES ONLY.
				// Draw the polygon on the screen
				// const debugEl = document.createElement("div");
				// debugEl.style.position = "fixed";
				// debugEl.style.pointerEvents = "none";
				// debugEl.style.zIndex = "9999";
				// debugEl.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
				// debugEl.style.border = "1px solid red";
				//
				// const points = polygon.map((p) => `${p.x}px ${p.y}px`).join(", ");
				// debugEl.style.clipPath = `polygon(${points})`;
				//
				// debugEl.style.width = "100vw";
				// debugEl.style.height = "100vh";
				// debugEl.style.left = "0";
				// debugEl.style.top = "0";
				//
				// document.body.appendChild(debugEl);
				//
				// // Clean up previous debug element if any
				// const prevDebug = document.querySelector("[data-melt-tooltip-debug]");
				// if (prevDebug) prevDebug.remove();
				//
				// debugEl.setAttribute("data-melt-tooltip-debug", "");
				// DEBUG END

				this.#isMouseInTooltipArea =
					this.#isPointerInsideContent ||
					this.#isPointerInsideTrigger ||
					isPointerInGraceArea(e, polygon);

				if (this.#openReason !== "pointer") return;

				if (!this.#isMouseInTooltipArea) {
					this.#closeTooltip();
				}
			});
		});
	}

	get open() {
		return this.#open.current;
	}

	set open(value: boolean) {
		this.#open.current = value;
	}

	get #sharedProps() {
		return {
			onfocusout: async () => {
				await new Promise((r) => setTimeout(r)); // tick
				const contentEl = document.getElementById(this.ids.content);
				const triggerEl = document.getElementById(this.ids.trigger);

				if (
					contentEl?.contains(document.activeElement) ||
					triggerEl?.contains(document.activeElement)
				) {
					return;
				}
				this.open = false;
			},
			style: styleAttr({
				"--melt-invoker-width": `${this.invokerRect?.width ?? 0}px`,
				"--melt-invoker-height": `${this.invokerRect?.height ?? 0}px`,
				"--melt-invoker-x": `${this.invokerRect?.x ?? 0}px`,
				"--melt-invoker-y": `${this.invokerRect?.y ?? 0}px`,
			}),
		};
	}

	get trigger() {
		return {
			[dataAttrs.trigger]: "",
			id: this.ids.trigger,
			"aria-describedby": this.ids.content,
			"data-open": dataAttr(this.open),
			onpointerdown: () => {
				if (!this.closeOnPointerDown) return;

				this.open = false;
				this.#clickedTrigger = true;
				this.#stopOpening();
			},
			onpointerenter: (e) => {
				this.#isPointerInsideTrigger = true;
				if (e.pointerType === "touch") return;

				this.#openTooltip("pointer");
			},
			onpointermove: () => {
				this.#isPointerInsideTrigger = true;
			},
			onpointerleave: (e) => {
				this.#isPointerInsideTrigger = false;
				if (e.pointerType === "touch") return;

				this.#stopOpening();
			},
			onfocus: () => {
				if (this.#clickedTrigger) return;

				this.#openTooltip("focus");
			},
			onblur: () => this.#closeTooltip(true),
			[createAttachmentKey()]: () => {
				const el = document.getElementById(this.ids.content);
				if (!isHtmlElement(el)) return;

				return () => (this.#isPointerInsideTrigger = false);
			},
			...this.#sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get content() {
		return {
			[dataAttrs.content]: "",
			id: this.ids.content,
			popover: "manual",
			role: "tooltip",
			tabindex: -1,
			inert: !this.open,
			"data-open": dataAttr(this.open),
			onpointerenter: () => {
				this.#isPointerInsideContent = true;
				this.#openTooltip("pointer");
			},
			onpointerleave: () => {
				this.#isPointerInsideContent = false;
			},
			onpointerdown: () => this.#openTooltip("pointer"),
			[createAttachmentKey()]: () => {
				$effect(() => {
					const triggerEl = document.getElementById(this.ids.trigger);
					const contentEl = document.getElementById(this.ids.content);

					if (!triggerEl || !contentEl || !this.open) return;

					useFloating({
						node: () => triggerEl,
						floating: () => contentEl,
						config: {
							...this.floatingConfig,
							onCompute: ({ floatingApply, arrowApply, ...data }) => {
								this.#floatingData = data;
								if (this.floatingConfig?.onCompute) {
									this.floatingConfig.onCompute({ floatingApply, arrowApply, ...data });
								} else {
									floatingApply();
									arrowApply();
								}
							},
						},
					});
				});

				$effect(() => {
					const triggerEl = document.getElementById(this.ids.trigger);
					const contentEl = document.getElementById(this.ids.content);

					if (!triggerEl || !contentEl) return;

					if (!this.isVisible) {
						safelyHidePopover(contentEl);
						return () => (this.#isPointerInsideContent = false);
					}

					return autoOpenPopover({ el: contentEl });
				});

				useEventListener(
					() => document,
					"scroll",
					(e) => this.#handleScroll(e),
					{ capture: true },
				);

				useEventListener(
					() => document,
					"keydown",
					(e) => {
						const el = document.getElementById(this.ids.content);
						if (e.key !== "Escape" || !this.open || !el) return;

						e.preventDefault();
						const openTooltips = [...el.querySelectorAll("[popover]")].filter((child) => {
							if (!isHtmlElement(child)) return false;
							// If child is a Melt popover, check if it's open
							if (child.matches(dataSelectors.content)) return child.dataset.open !== undefined;
							return child.matches(":popover-open");
						});

						if (openTooltips.length) return;

						this.#stopOpening();
						setTimeout(() => (this.open = false));
					},
				);
			},
			...this.#sharedProps,
			style: this.#sharedProps.style + `overflow: visible;`,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get arrow() {
		return {
			[dataAttrs.arrow]: "",
			id: this.ids.arrow,
			"data-arrow": "",
			"aria-hidden": true,
			"data-open": dataAttr(this.open),
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	#openTooltip(reason: OpenReason) {
		if (this.#closeTimeout) {
			window.clearTimeout(this.#closeTimeout);
			this.#closeTimeout = null;
		}

		if (!this.#openTimeout) {
			this.#openTimeout = window.setTimeout(() => {
				this.open = true;
				this.#openReason = this.#openReason ?? reason;
				this.#openTimeout = null;
			}, this.openDelay);
		}
	}

	#stopOpening() {
		if (this.#openTimeout) {
			window.clearTimeout(this.#openTimeout);
			this.#openTimeout = null;
		}
	}

	#closeTooltip(isBlur?: boolean) {
		const contentEl = document.getElementById(this.ids.content);
		if (!isHtmlElement(contentEl)) return;

		this.#stopOpening();

		if (isBlur && this.#isMouseInTooltipArea) {
			this.#openReason = "pointer";
			return;
		}

		if (!this.#closeTimeout) {
			this.#closeTimeout = window.setTimeout(() => {
				this.open = false;
				this.#openReason = null;
				if (isBlur) this.#clickedTrigger = false;
				this.#closeTimeout = null;
			}, this.closeDelay);
		}
	}

	#handleScroll(e: Event) {
		if (!this.open) return;

		const target = e.target;
		if (!(target instanceof Element) && !(target instanceof Document)) return;

		const triggerEl = document.getElementById(this.ids.trigger);
		if ((triggerEl && target.contains(triggerEl)) || this.open) {
			this.#closeTooltip();
		}
	}
}
