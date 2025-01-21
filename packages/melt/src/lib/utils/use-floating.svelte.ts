import type { MaybeGetter } from "$lib/types";
import { arrow, offset, flip, shift, type ComputePositionConfig, computePosition, autoUpdate, type Placement, type VirtualElement } from "@floating-ui/dom";
import { isHtmlElement } from "./is";
import { deepMerge } from "./merge";
import { extract } from "./extract";

const ARROW_TRANSFORM = {
	bottom: "rotate(45deg)",
	left: "rotate(135deg)",
	top: "rotate(225deg)",
	right: "rotate(315deg)",
};

export function useFloating(
    _node: MaybeGetter<HTMLElement | VirtualElement>, 
    _floating: MaybeGetter<HTMLElement>,
    _options: MaybeGetter<ComputePositionConfig | undefined>
) {
    const nodeEl = $derived(extract(_node));
    const floatingEl = $derived(extract(_floating));
    const options = $derived(extract(_options, {}));
    
    const compute = () => {
        const arrowEl = floatingEl.querySelector("[data-arrow=true]");
        const arrowOffset = isHtmlElement(arrowEl) ? arrowEl.offsetHeight / 2 : 0;
        const arrowMiddleware = isHtmlElement(arrowEl) ? arrow({ element: arrowEl }) : undefined;
        const baseOptions: Partial<ComputePositionConfig> = {
            middleware: [shift(), flip(), arrowMiddleware, offset({ mainAxis: 8 + arrowOffset })],
        };
        computePosition(
            nodeEl,
            floatingEl,
            deepMerge(baseOptions, options),
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
        });
    };

    $effect(() => {
        return autoUpdate(nodeEl, floatingEl, compute);
    });
}