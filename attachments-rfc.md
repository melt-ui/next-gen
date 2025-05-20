# Attachments RFC

Since Svelte 5.29, attachments have been available. With it, we can directly interface with a given node, which gives us:

- Safe effects
- Non-overridable event listeners (danger!)
- No need for IDs that are exclusively to get reference to a node

This also means we'd no longer need `mergeAttrs`, or almost never. However! There's a problem. If a user wants to override an event listener inside an attachment, they cannot. We _need_ to allow this functionality however.

So here are some ideas to deal with this.

## Prevent methods?

Would be cool to be able to do something like:

```svelte
<button
	{...toggle.trigger}
	onclick={() => {
		toggle.trigger.click.prevent();
		if (condition) {
			toggle.triger.click();
		}
	}}
/>
```

This is my favorite. Lets POC it.

## Prevent attributes

Be it with `{...toggle.trigger({prevent: 'click'})}` or `<button {...toggle.trigger} prevent-click />`

## Custom events

Bleh.
