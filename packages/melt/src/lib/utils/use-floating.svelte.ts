import type { MaybeGetter } from "$lib/types";
import {
	arrow,
	offset,
	flip,
	shift,
	type ComputePositionConfig,
	computePosition,
	autoUpdate,
	type Placement,
	type VirtualElement,
	type ShiftOptions,
	type FlipOptions,
	type ArrowOptions,
	type OffsetOptions,
	size,
	type ComputePositionReturn,
} from "@floating-ui/dom";
import { isFunction, isHtmlElement } from "./is";
import { deepMerge } from "./merge";
import { extract } from "./extract";
import { getters } from "./getters.svelte";

const ARROW_TRANSFORM = {
	bottom: "rotate(45deg)",
	left: "rotate(135deg)",
	top: "rotate(225deg)",
	right: "rotate(315deg)",
};

export type FloatingApply = (el?: HTMLElement) => void;
export type ArrowApply = (el?: HTMLElement) => void;
export type OnComputeArgs = ComputePositionReturn & {
	floatingApply: FloatingApply;
	arrowApply: ArrowApply;
};
export type OnCompute = (args: OnComputeArgs) => void;

/**
 * Config for UseFloating. You may pass in options to the underlying Floating UI
 * `computePosition`, or to the middleware's Melt calls initially.
 */
export type UseFloatingConfig = {
	computePosition?: Partial<ComputePositionConfig>;
	shift?: ShiftOptions;
	flip?: FlipOptions;
	arrow?: ArrowOptions;
	offset?: OffsetOptions;
	sameWidth?: boolean;
	/**
	 * Use a custom function when `computePosition` is returned.
	 *
	 * This will override default behaviour! If you want to add
	 * functionality while keeping the original intact, just call
	 * `floatingApply` and `arrowApply` respectively.
	 */
	onCompute?: OnCompute;
};

/** All the parameters UseFloating returns */
export type UseFloatingArgs = {
	node: MaybeGetter<HTMLElement | VirtualElement>;
	floating: MaybeGetter<HTMLElement>;
	config?: MaybeGetter<UseFloatingConfig | undefined>;
};

export function useFloating(args: UseFloatingArgs) {
	const nodeEl = $derived(extract(args.node));
	const floatingEl = $derived(extract(args.floating));
	const config = $derived(extract(args.config, {} as UseFloatingConfig));
	let data = $state<ComputePositionReturn>();

	const compute = () => {
		const arrowEl = floatingEl.querySelector("[data-arrow]");
		const arrowOffset = isHtmlElement(arrowEl) ? arrowEl.offsetHeight / 2 : 0;
		const arrowMiddleware = isHtmlElement(arrowEl)
			? arrow({ element: arrowEl, ...config.arrow })
			: undefined;

		const baseOptions: Partial<ComputePositionConfig> = {
			middleware: [
				shift(config.shift),
				flip(config.flip),
				arrowMiddleware,
				offset(
					typeof config.offset === "number"
						? config.offset
						: { mainAxis: 8 + arrowOffset, ...config.offset },
				),
				config.sameWidth
					? size({
							apply({ rects, elements }) {
								Object.assign(elements.floating?.style ?? {}, {
									width: `${rects.reference.width}px`,
									minWidth: `${rects.reference.width}px`,
								});
							},
						})
					: undefined,
			],
		};

		computePosition(nodeEl, floatingEl, deepMerge(baseOptions, config.computePosition ?? {})).then(
			(returned) => {
				data = returned;
				const { x, y, placement, middlewareData, strategy } = returned;

				const floatingApply: FloatingApply = (el = floatingEl) => {
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

					Object.assign(el.style, {
						position: strategy,
						left: `${x}px`,
						top: `${y}px`,
					});

					const [side, align = "center"] = placement.split("-");

					el.style.transformOrigin = transformOriginMap[placement];
					el.dataset.side = side;
					el.dataset.align = align;
				};

				const arrowApply: ArrowApply = (el = undefined) => {
					const actualEl = el ?? arrowEl;
					if (!isHtmlElement(actualEl) || !middlewareData.arrow) return;
					const { x, y } = middlewareData.arrow;
					const dir = placement.split("-")[0] as "top" | "bottom" | "left" | "right";

					Object.assign(actualEl.style, {
						position: "absolute",
						left: x ? `${x}px` : "",
						top: y ? `${y}px` : "",
						[dir]: `calc(100% - ${arrowOffset}px)`,
						transform: ARROW_TRANSFORM[dir],
						backgroundColor: "inherit",
						zIndex: "inherit",
					});

					actualEl.dataset.side = dir;
				};

				if (isFunction(config.onCompute)) {
					config.onCompute({ ...returned, arrowApply, floatingApply });
				} else {
					floatingApply();
					arrowApply();
				}
			},
		);
	};

	$effect(() => {
		return autoUpdate(nodeEl, floatingEl, compute);
	});

	return {
		get data() {
			return data;
		},
	};
}
