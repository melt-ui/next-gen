![](static/banner.png)

[Melt](https://next.melt-ui.com/) for Svelte 🧡: The best headless component library for Svelte. Now with Runes.

[![](https://img.shields.io/npm/v/melt?style=flat)](https://www.npmjs.com/package/melt)
![npm](https://img.shields.io/npm/dw/melt?style=flat&color=orange)

[![](https://dcbadge.vercel.app/api/server/2QDjZkYunf?style=flat)](https://melt-ui.com/discord)

## About

Melt UI is meant to be used as a base for your own styles and components. It offers:

- Uncoupled builders that can be attached to any element/component
- A clean API focused on simplicity and flexibility
- Typescript and [SvelteKit](https://kit.svelte.dev/) support out-of-the-box
- Strict adherence to [WAI-ARIA guidelines](https://www.w3.org/WAI/ARIA/apg/)
- A high emphasis on accessibility, extensibility, quality and consistency

## Basic Usage

```sh
npm i melt
```

Melt UI provides two ways to use components.

### Using Builders

Builders can be called from a Svelte component, or `svelte.js|ts` files.
Uses getters and setters for reactive properties.

```html
<script lang="ts">
	import { Toggle } from "melt/builders";

	let value = $state(false)
	const toggle = new Toggle({
		value: () => value,
		onValueChange: (v) => (value = v),
	});
</script>

<button {...toggle.trigger}>
	{toggle.value ? "On" : "Off"}
</button>
```

### Using Components

The component pattern provides a more traditional Svelte experience. It provides no elements
or styling, and instead provides you with a instance from the builder. The difference lies in being
able to use the `bind:` directive.

```html
<script lang="ts">
	import { Toggle } from "melt/components";

	let value = $state(false)
</script>

<Toggle bind:value>
	{#snippet children(toggle)}
		<button {...toggle.trigger}>
			{toggle.value ? "On" : "Off"}
		</button>
	{/snippet}
</Toggle>
```

### Discord

Got any questions? Want to talk to the maintainers?

Our [Discord community](https://melt-ui.com/discord) is a great place to get in touch with us, and
we'd love to have you there.

<a href="https://melt-ui.com/discord" alt="Melt UI Discord community">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://invidget.switchblade.xyz/2QDjZkYunf">
  <img alt="Melt UI Discord community" src="https://invidget.switchblade.xyz/2QDjZkYunf?theme=light">
</picture>
</a>