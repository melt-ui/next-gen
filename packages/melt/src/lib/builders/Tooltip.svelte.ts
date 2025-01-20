import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { untrack } from "svelte";
import { deepMerge } from "$lib/utils/merge";
import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	arrow,
	shift,
	type ComputePositionConfig,
	type Placement,
} from "@floating-ui/dom";
import type { HTMLAttributes } from "svelte/elements";
import { on } from "svelte/events";
import { makeHullFromElements } from "$lib/utils/polygon";
import { isPointerInGraceArea } from "$lib/utils/pointer";

const dataIds = createDataIds("tooltip", ["trigger", "content", "arrow"]);

const ARROW_TRANSFORM = {
	bottom: "rotate(45deg)",
	left: "rotate(135deg)",
	top: "rotate(225deg)",
	right: "rotate(315deg)",
};

type OpenReason = "pointer" | "focus";

export type TooltipProps = {
	open?: MaybeGetter<boolean | undefined>;
	onOpenChange?: (value: boolean) => void;
	arrowSize?: MaybeGetter<number | undefined>;
	closeOnPointerDown?: MaybeGetter<boolean | undefined>;
	openDelay?: MaybeGetter<number | undefined>;
	closeDelay?: MaybeGetter<number | undefined>;
	computePositionOptions?: MaybeGetter<Partial<ComputePositionConfig> | undefined>;
	forceVisible?: MaybeGetter<boolean | undefined>;
	disableHoverableContent?: MaybeGetter<boolean | undefined>;
};

export class Tooltip {
	#props!: TooltipProps;
	forceVisible = $derived(extract(this.#props.forceVisible, false));
	computePositionOptions = $derived(extract(this.#props.computePositionOptions, {}));
	closeOnPointerDown = $derived(extract(this.#props.closeOnPointerDown, true));
	openDelay = $derived(extract(this.#props.openDelay, 1000));
	closeDelay = $derived(extract(this.#props.closeDelay, 0));
	disableHoverableContent = $derived(extract(this.#props.disableHoverableContent, false));
	arrowSize = $derived(extract(this.#props.arrowSize, 8));
	#isVisible = $derived(this.open || this.forceVisible);

	#open!: Synced<boolean>;

	#openReason: OpenReason | null  = $state(null);
	#clickedTrigger: boolean = $state(false);
	#isPointerInsideTrigger: boolean = $state(false);
	#isPointerInsideContent: boolean = $state(false);
	#isMouseInTooltipArea: boolean = $state(false);
	#openTimeout: number | null = $state(null);
	#closeTimeout: number | null = $state(null);

	constructor(props: TooltipProps = {}) {
		this.#open = new Synced({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false
		});
		this.#props = props;

		$effect(() => {
			this.open;
			this.#openReason;

			if (!this.open || !(typeof document !== 'undefined')) return;

			return on(document, "mousemove", (e) => untrack(() => {
				const contentEl = document.getElementById(dataIds["content"]);
				const triggerEl = document.getElementById(dataIds["trigger"]);
				if (!contentEl || !triggerEl) return;

				const polygonElements = this.disableHoverableContent
					? [triggerEl]
					: [triggerEl, contentEl];
				const polygon = makeHullFromElements(polygonElements);

				this.#isMouseInTooltipArea = 
					this.#isPointerInsideContent 
					|| this.#isPointerInsideTrigger 
					|| isPointerInGraceArea(e, polygon);

				if (this.#openReason !== "pointer") return;

				if (!this.#isMouseInTooltipArea) {
					this.#closeTooltip();
				}
			}));
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
				await new Promise((r) => setTimeout(r));
				const contentEl = document.getElementById(dataIds["content"]);
				const triggerEl = document.getElementById(dataIds["trigger"]);

				if (
					contentEl?.contains(document.activeElement) ||
					triggerEl?.contains(document.activeElement)
				) {
					return;
				}
				this.open = false;
			},
		};
	}

	get trigger() {
		$effect(() => { 
			const el = document.getElementById(dataIds["content"]);
			if (!isHtmlElement(el)) return;

			return () => (this.#isPointerInsideTrigger = false); 
		});

		return {
			id: dataIds["trigger"],
			'aria-describedby': dataIds["content"],
			'data-state': this.open ? "open" : "closed",
			onpointerdown: () => {
				if (!this.closeOnPointerDown) return;
				this.open = false;
				this.#clickedTrigger = true;
				if (this.#openTimeout) {
					window.clearTimeout(this.#openTimeout);
					this.#openTimeout = null;
				}
			},
			onpointerenter: (e) => {
				this.#isPointerInsideTrigger = true;
				if (e.pointerType === "touch") return;
				this.#openTooltip("pointer");
			},
			onpointerleave: (e) => {
				this.#isPointerInsideTrigger = false;
				if (e.pointerType === "touch") return;
				if (this.#openTimeout) {
					window.clearTimeout(this.#openTimeout);
					this.#openTimeout = null;
				}
			},
			onfocus: () => {
				if (this.#clickedTrigger) return;
				this.#openTooltip("focus");
			},
			onblur: () => this.#closeTooltip(true),
			...this.#sharedProps
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get content() {
		const compute = () => {
			const contentEl = document.getElementById(dataIds["content"]);
			const triggerEl = document.getElementById(dataIds["trigger"]);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			const arrowEl = contentEl.querySelector("[data-arrow=true]");
			const arrowOffset = arrowEl instanceof HTMLElement ? arrowEl.offsetHeight / 2 : 0;
			const arrowMiddleware = arrowEl instanceof HTMLElement ? arrow({ element: arrowEl }) : undefined;
			const baseOptions: Partial<ComputePositionConfig> = {
				middleware: [shift(), flip(), arrowMiddleware, offset({ mainAxis: 8 + arrowOffset })],
			};
			computePosition(
				triggerEl,
				contentEl,
				deepMerge(baseOptions, this.computePositionOptions),
			).then(({ x, y, placement, middlewareData, strategy }) => {
				const transformOriginMap: Record<Placement, string> = {
					top: "bottom center",
					"top-start": "bottom left",
					"top-end": "bottom right",

					bottom: "top center",
					"bottom-start": "top left",
					"bottom-end": "top right",

					left: "center center",
					"left-start": "top left",
					"left-end": "bottom left",

					right: "center center",
					"right-start": "top right",
					"right-end": "bottom right",
				};

				Object.assign(contentEl.style, {
					position: strategy,
					left: `${x}px`,
					top: `${y}px`,
				});

				contentEl.style.transformOrigin = transformOriginMap[placement];
				contentEl.dataset.side = placement;

				if (arrowEl instanceof HTMLElement && middlewareData.arrow) {
					const { x, y } = middlewareData.arrow;

					const dir = placement.split("-")[0] as 'top' | 'bottom' | 'left' | 'right';

					Object.assign(arrowEl.style, {
						position: 'absolute',
						left: x ? `${x}px` : '',
						top: y ? `${y}px` : '',
						[dir]: `calc(100% - ${arrowOffset}px)`,
						transform: ARROW_TRANSFORM[dir],
						backgroundColor: 'inherit',
						zIndex: 'inherit'
					});

					arrowEl.dataset.side = dir;
				}
			});
		};

		$effect(() => {
			const contentEl = document.getElementById(dataIds["content"]);
			const triggerEl = document.getElementById(dataIds["trigger"]);
			if (!isHtmlElement(contentEl) || !isHtmlElement(triggerEl)) {
				return;
			}

			const unsubAutoUpdate = autoUpdate(triggerEl, contentEl, compute);
			const unsubOnScroll = on(window, "scroll", (e) => this.#handleScroll(e), { capture: true });

			return () => {
				this.#isPointerInsideContent = false;
				unsubAutoUpdate();
				unsubOnScroll();
			};
		});

		return {
			id: dataIds["content"],
			role: "tooltip",
			hidden: this.#isVisible ? undefined : true,
			tabindex: -1,
			style: this.#isVisible ? "position: absolute;" : "display: none;",
			"data-state": this.open ? "open" : "closed",
			onpointerenter: () => {
				this.#isPointerInsideContent = true;
				this.#openTooltip('pointer');
			},
			onpointerleave: () => {
				this.#isPointerInsideContent = false;
			},
			onpointerdown: () => this.#openTooltip('pointer'),
			...this.#sharedProps,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get arrow() {
		return {
			id: dataIds["arrow"],
			"data-arrow": true,
			style: `
				position: absolute; 
				width: var(--arrow-size, ${this.arrowSize}px);
				height: var(--arrow-size, ${this.arrowSize}px);`,
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

	#closeTooltip(isBlur?: boolean) {
		if (this.#openTimeout) {
			window.clearTimeout(this.#openTimeout);
			this.#openTimeout = null;
		}

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
		const triggerEl = document.getElementById(dataIds["trigger"]);
		if (triggerEl && target.contains(triggerEl)) {
			this.#closeTooltip();
		}
	}
}