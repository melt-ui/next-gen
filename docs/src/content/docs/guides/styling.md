---
title: Styling
description: Learn how to style Melt UI components to match your design system.
---

Melt UI is designed to be completely unopinionated about styling. Components provide the structure and functionality, while you have full control over the appearance. This makes it easy to integrate Melt UI with any design system or CSS framework.

## DOM Attributes

Each component exposes specific DOM attributes that you can use to style different states. For example, a Toggle component adds `data-melt-toggle-trigger` to identify the trigger element and `data-checked` for its state:

```svelte {13,17-18}
<script lang="ts">
	import { Toggle } from "melt/builders";

	const toggle = new Toggle();
</script>

<button {...toggle.trigger}>
	{toggle.value ? "On" : "Off"}
</button>

<style>
	/* Target the toggle trigger element */
	[data-melt-toggle-trigger] {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
	}
	/* Style the checked state */
	[data-melt-toggle-trigger][data-checked] {
		background: #3b82f6;
		color: white;
	}
</style>
```

## Inline Styles

You can use component values directly in inline styles:

```svelte {1}
<button {...toggle.trigger} style="color: {toggle.value ? 'white' : '#374151'}">
	{toggle.value ? "On" : "Off"}
</button>
```

## Using CSS Variables

Some components provide CSS variables that you can use to control layout and positioning:

### Slider Example

```svelte {22}
<script lang="ts">
	import { Slider } from "melt/builders";

	const slider = new Slider();
</script>

<div {...slider.root}>
	<div class="track">
		<div class="thumb" {...slider.thumb} />
	</div>
</div>

<style>
	.track {
		height: 4px;
		background: #e2e8f0;
		position: relative;
	}

	.thumb {
		position: absolute;
		left: var(--percentage);
		top: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		background: #3b82f6;
		border-radius: 50%;
	}
</style>
```
