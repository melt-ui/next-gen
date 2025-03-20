---
title: How to use
description: Learn how Melt's API works, and the recommended patterns and practices for using Melt UI effectively.
---

## Builders & Components

Melt UI ships Builders and Components. The way they work is fairly similar, but there are some key differences.

### Using Builders

Builders can be called from a Svelte component, or `svelte.js|ts` files.

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	let value = $state(false);
	const toggle = new Toggle({
		value: () => value,
		onValueChange: (v) => (value = v),
		disabled: false,
	});
</script>

<button {...toggle.trigger}>
	{toggle.value ? "On" : "Off"}
</button>
```

Builders are functions that return `attributes` to be spread onto elements e.g. `toggle.trigger`, and `state`, e.g. `toggle.value` and `toggle.disabled`.

For each builder, we show a simple usage example in its documentation page.

#### Static vs Reactive

Builders accept, for most props, both static and reactive values.

In the above snippet, disabled is a static value, meaning it will never change.

If we want it to change, we can pass in a reference to an outside variable declared with `$state`.

```ts
let disabled = $state(false);

const toggle = new Toggle({
	disabled: () => disabled,
});

toggle.disabled; // false
disabled = true;
toggle.disabled; // true
```

The type for the disabled prop is `MaybeGetter<boolean>`. The `MaybeGetter` type appears often on the Melt codebase.

### Using Components

The component pattern provides a more traditional Svelte experience. It provides no elements
or styling, and instead provides you with a instance from the builder. The difference lies in being
able to use the `bind:` directive.

```svelte
<script lang="ts">
	import { Toggle } from "melt/components";

	let value = $state(false);
</script>

<Toggle bind:value>
	{#snippet children(toggle)}
		<button {...toggle.trigger}>
			{toggle.value ? "On" : "Off"}
		</button>
	{/snippet}
</Toggle>
```

Its more straight-forward to use, but can be a bit more verbose on the template, so Melt offers both APIs.

## Controlled vs Uncontrolled

Melt's builders and components, by default, have inner state, that's not dictated by an outside source of truth.

If we take `Toggle`, for example, we'll see it comes with a `value` field.

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	const toggle = new Toggle();
	toggle.value; // false
</script>
```

Whenever you click the toggle, `toggle.value` will change. You can also directly set this value, e.g. `toggle.value = true`.

For more complex state management however, Melt offers you the ability to control state.

By defining outside state, and passing a reference to it via a getter function, Melt will use that as a source of truth.

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	let isEnabled = $state(false);

	const toggle = new Toggle({
		value: () => isEnabled,
	});
</script>
```

In the above snippet, the `toggle` value will only change whenever `isEnabled` changes. Meaning that, even if you click `toggle.trigger`, it will not change its value. Only when `isEnabled` is changed will `toggle.value` change as well.

However, in most cases you do want to change `isEnabled` whenever `toggle.trigger` is clicked. So `Toggle` ships a helpful `onValueChange` prop, which is called whenever `toggle.value` is supposed to change.

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	let isEnabled = $state(false);

	const toggle = new Toggle({
		value: () => isEnabled,
		onValueChange(v: boolean) {
			isEnabled = v;
		},
	});
</script>
```

This basically mimics how `Toggle` works under the hood. Why whould you want this then?

There are some reasons. The most common one is encapsulation.

### Encapsulation

Melt is a low-level UI library. It provides a powerful API, but with it comes a lot of moving parts.

A common practice is to create a higher-level component that is built from Melt's primitives. This makes it easier to understand and use the library,
and you can re-use your own styles and definitions.

For example, here's an example of a styled pin-input.

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

In the above snippet, we use `PinInput` in a controlled manner, allowing us to use component props, instead of inner state that is unacessible outside its context.

You may also spot some helpful utilities that makes encapsulating easier, such as `ComponentProps` and `getters`.

### Overriding changes

Another reason to use controlled state is to be in control of when the state is changed.

A simple example would be a toggle button, which waits for the value to be saved to the backend before committing anything.

```svelte
<script lang="ts">
	import { Toggle } from "melt/builders";

	let isEnabled = $state(false);
	let isSaving = $state(false);

	async function onChange(v: boolean) {
		isSaving = true;
		try {
			const newValue = await save("key", v);
			isEnabled = newValue;
		} catch {
			console.error("Error! Do something dev!");
		} finally {
			isSaving = false;
		}
	}

	const toggle = new Toggle({
		value: () => isEnabled,
		onValueChange: onChange,
	});
</script>

<button
	{...toggle.trigger}
	aria-label="toggle favourite"
	class={isSaving && "cursor-not-allowed opacity-75"}
>
	{toggle.value ? "✅" : "❌"}
</button>
```

## Multiple values

You may notice that some builders have `MaybeMultiple` props. These props expect different values, depending if an accompanying prop is set to `true` or `false`.

A good example for this is the `FileUpload` builder. It has a `selected` prop, and a `multiple` prop.

`selected`'s type is `MaybeMultiple<File, Multiple>`.

This means that, if `multiple` is `false` or `undefined`, it will accept a `MaybeGetter<File>`, which works how normal reactive values work, as explained earlier in this page.

However, is `multiple` is set to `true`, it accepts an `IterableProp<File>`, which accepts an either a `SvelteSet`, or a `MaybeGetter<Iterable<File>>`.

If its a `SvelteSet`, or a `Getter`, its [controlled](/guides/how-to-use#controlled-vs-uncontrolled). Otherwise, its uncontrolled.
