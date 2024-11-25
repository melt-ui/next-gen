<script module lang="ts">
	import { type TagNameMap } from "../types.ts";

	import type { Action } from "svelte/action";

	type Parameter =
		| (DOMKeyframesDefinition & {
				transition?: DynamicAnimationOptions;
		  })
		| undefined;

	export const animate: Action<Element, Parameter> = (node, { transition, ...keyframes } = {}) => {
		let animation = motionAnimate(node, keyframes, transition);
		return {
			update: ({ transition, ...keyframes } = {}) => {
				animation.stop();
				animation = motionAnimate(node, keyframes, transition);
			},
			destroy: () => {
				animation.cancel();
			},
		};
	};

	export function generateCssFromInitial(initial?: DOMKeyframesDefinition): string {
		const transformMap: Record<string, string> = {
			x: "translateX",
			y: "translateY",
			z: "translateZ",
			rotateX: "rotateX",
			rotateY: "rotateY",
			rotateZ: "rotateZ",
			scale: "scale",
			scaleX: "scaleX",
			scaleY: "scaleY",
			scaleZ: "scaleZ",
			skewX: "skewX",
			skewY: "skewY",
		};

		const transformProperties: string[] = [];
		const otherStyles: string[] = [];

		for (const [key, value] of Object.entries(initial ?? {})) {
			if (value === undefined || value === null) continue; // Skip undefined or null values

			if (key in transformMap) {
				// Gestione delle proprietà di transform
				const transformKey = transformMap[key];
				const transformValue =
					typeof value === "number" && !["scale", "scaleX", "scaleY", "scaleZ"].includes(key)
						? `${value}px` // Aggiungi "px" solo se necessario
						: value;
				transformProperties.push(`${transformKey}(${transformValue})`);
			} else {
				// Gestione delle proprietà CSS standard
				const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase(); // Convert camelCase to kebab-case
				const cssValue = typeof value === "number" && key !== "opacity" ? `${value}px` : value; // Aggiungi "px" solo se appropriato
				otherStyles.push(`${cssKey}: ${cssValue};`);
			}
		}

		// Combina le proprietà di transform in una singola stringa
		if (transformProperties.length > 0) {
			otherStyles.push(`transform: ${transformProperties.join(" ")};`);
		}

		return otherStyles.join(" ");
	}
</script>

<script lang="ts" generics="Tag extends keyof TagNameMap">
	import type { SvelteHTMLElements } from "svelte/elements";
	import { animate as motionAnimate } from "motion";
	import { tick, untrack, type Snippet } from "svelte";
	import type { DOMKeyframesDefinition, DynamicAnimationOptions } from "motion/react";
	import { watch } from "runed";

	type Attrs = SvelteHTMLElements[Tag];
	type El = TagNameMap[Tag];

	type MotionProps = {
		tag: Tag;
		children: Snippet;
		initial?: DOMKeyframesDefinition;
		animate?: DOMKeyframesDefinition;
		exit?: DOMKeyframesDefinition;
		whileHover?: DOMKeyframesDefinition;
		whileTap?: DOMKeyframesDefinition;
		transition?: DynamicAnimationOptions;
		options?: DynamicAnimationOptions;
	} & Attrs;

	const {
		tag,
		children,
		initial,
		animate,
		exit,
		transition,
		whileHover,
		whileTap,
		...rest
	}: MotionProps = $props();

	let el = $state<El>();
	let ssrStyle = $state(generateCssFromInitial(initial ?? animate));
	let isHover = $state(false);
	let isTap = $state(false);

	function runAnimation(keyframes: DOMKeyframesDefinition, t?: DynamicAnimationOptions, _el = el) {
		if (!_el) {
			return;
		}
		return motionAnimate(_el, keyframes, t);
	}

	function onExit(node: El) {
		const duration = transition?.duration ?? 0.3;
		if (exit) {
			runAnimation(exit, transition, node);
			return {
				duration: duration * 1000,
			};
		}
		return {
			duration: 0,
		};
	}

	$effect(() => {
		if (!el) return;
		untrack(async () => {
			if (el && initial) {
				ssrStyle = "";
				await tick();
				await runAnimation(initial, {
					duration: 0,
				});
			}
			if (el && animate) {
				runAnimation(animate, transition);
			}
		});
	});

	watch(
		[() => animate, () => el, () => transition],
		() => {
			if (!el || !animate) return;
			runAnimation(animate, transition);
		},
		{ lazy: true },
	);

	watch([() => isHover && whileHover, () => isTap && whileTap], () => {
		if (!el) {
			return;
		}
		if (isTap && whileTap) {
			runAnimation(whileTap, transition);
		} else if (isHover && whileHover) {
			runAnimation(whileHover, transition);
		} else if (initial && (whileTap || whileHover)) {
			runAnimation(initial, transition);
		}
	});
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={tag}
	bind:this={el}
	style={ssrStyle}
	onmouseover={() => {
		isHover = true;
	}}
	onmouseleave={() => {
		isHover = false;
	}}
	ontouchstart={() => {
		isTap = true;
	}}
	ontouchend={() => {
		isTap = false;
	}}
	onmousedown={() => {
		isTap = true;
	}}
	onmouseup={() => {
		isTap = false;
	}}
	out:onExit
	{...rest}
>
	{@render children?.()}
</svelte:element>
