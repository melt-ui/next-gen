---
title: API Reference
description: Detailed API documentation for Melt UI components and utilities.
---

## Component APIs

Each Melt UI component exposes a consistent API pattern through both its builder and component implementations.

### Common Patterns

Most components follow these common patterns:

- **Builder Creation**: Instantiate with optional configuration
- **Root Element**: Access via `.root` for base attributes
- **Value Management**: Get/set via `.value` property
- **Event Handlers**: Prefixed with `on`, like `onValueChange`
- **State Queries**: Methods prefixed with `is`, like `isSelected`
- **Actions**: Methods for state manipulation, like `select`, `deselect`

### Type Definitions

Components expose TypeScript types for props and events:

```ts
// Builder props type
type ToggleProps = {
	value?: MaybeGetter<boolean>;
	onValueChange?: (value: boolean) => void;
	disabled?: MaybeGetter<boolean>;
};
```

## Utility Types

### MaybeGetter<T>

Represents a value that can be either the type itself or a function that returns the type:

```ts
type MaybeGetter<T> = T | (() => T);

// Example usage
const toggle = new Toggle({
	// Direct value
	value: true,

	// Or getter function
	value: () => someStore.get(),
});
```

### ComponentProps<T>

Utility type for component props that handles proper typing of event handlers and other component-specific properties:

```ts
type ComponentProps<T> = {
	[K in keyof T]: T[K] extends Function ? T[K] : T[K] | undefined;
};
```

## Builder Methods

Common methods available on builders:

### State Management

```ts
// Toggle example
const toggle = new Toggle();

// Get current value
toggle.value;

// Set value
toggle.value = true;

// Check if disabled
toggle.disabled;
```

### DOM Attributes

```svelte
<script lang="ts">
	// Get attributes for root element
	toggle.root;
</script>

<!-- Spread into element -->
<button {...toggle.root}> Toggle </button>
```

### Event Handlers

```ts
const toggle = new Toggle({
	// Called when value changes
	onValueChange: (value) => {
		console.log("New value:", value);
	},
});
```

## Component Usage

Components wrap builders to provide a more traditional Svelte component experience:

```svelte
<script lang="ts">
	import { Toggle } from "melt/components";

	let value = $state(false);
</script>

<Toggle bind:value>
	{#snippet children(toggle)}
		<button {...toggle.root}>
			{toggle.value ? "On" : "Off"}
		</button>
	{/snippet}
</Toggle>
```
