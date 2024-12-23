---
title: Best Practices
description: Learn the recommended patterns and practices for using Melt UI effectively.
---

## Encapsulation

Melt is a low-level UI library. It provides a powerful API, but with it comes a lot of moving parts.

A common practice is to create a higher-level component that is built from Melt's primitives. This makes it easier to understand and use the library,
and you can re-use your own styles and definitions.

For example, here's an eample of a styled pin-input.

```svelte
<script lang="ts">
	import type { ComponentProps } from "melt";
	import { getters, PinInput, type PinInputProps } from "melt/builders";

	type Props = ComponentProps<PinInputProps>;
	let { value = $bindable(""), ...rest }: Props = $props();

	const pinInput = new PinInput({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

<div {...pinInput.root}>
	{#each pinInput.inputs as input}
		<input {...input} />
	{/each}
</div>
```

### Controlled Components

For more complex state management, use controlled components:

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	let isEnabled = $state(false);

	const toggle = new Toggle({
		value: () => isEnabled,
		onValueChange: (v) => (isEnabled = v),
	});
</script>
```
