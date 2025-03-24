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
} from "@floating-ui/dom";
import { isHtmlElement } from "./is";
import { deepMerge } from "./merge";
import { extract } from "./extract";

const ARROW_TRANSFORM = {
	bottom: "rotate(45deg)",
	left: "rotate(135deg)",
	top: "rotate(225deg)",
	right: "rotate(315deg)",
};

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
			],
		};

		computePosition(nodeEl, floatingEl, deepMerge(baseOptions, config.computePosition ?? {})).then(
			({ x, y, placement, middlewareData, strategy }) => {
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

				Object.assign(floatingEl.style, {
					position: strategy,
					left: `${x}px`,
					top: `${y}px`,
				});

				const [side, align = "center"] = placement.split("-");

				floatingEl.style.transformOrigin = transformOriginMap[placement];
				floatingEl.dataset.side = side;
				floatingEl.dataset.align = align;

				if (isHtmlElement(arrowEl) && middlewareData.arrow) {
					const { x, y } = middlewareData.arrow;
					const dir = placement.split("-")[0] as "top" | "bottom" | "left" | "right";

					Object.assign(arrowEl.style, {
						position: "absolute",
						left: x ? `${x}px` : "",
						top: y ? `${y}px` : "",
						[dir]: `calc(100% - ${arrowOffset}px)`,
						transform: ARROW_TRANSFORM[dir],
						backgroundColor: "inherit",
						zIndex: "inherit",
					});

					arrowEl.dataset.side = dir;
				}
			},
		);
	};

	$effect(() => {
		return autoUpdate(nodeEl, floatingEl, compute);
	});
}
