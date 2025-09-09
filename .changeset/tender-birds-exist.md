---
"melt": minor
---

Add `onNavigate` prop to Combobox and Select components for virtualization support

- **Combobox**: Added optional `onNavigate` callback to enable custom navigation logic for virtualized lists
- **Select**: Added optional `onNavigate` callback to enable custom navigation logic for virtualized lists

The `onNavigate` prop allows virtualization libraries to handle arrow key navigation properly by providing the full dataset instead of relying on DOM-queried options. This fixes wrap-around behavior where navigation would only cycle through currently rendered items instead of the complete list.

**Usage:**

```typescript
const combobox = new Combobox({
	onNavigate: (current, direction) => {
		// Handle navigation with full dataset
		const currentIndex = fullDataset.findIndex((item) => item === current);
		if (direction === "next") {
			return fullDataset[(currentIndex + 1) % fullDataset.length];
		} else {
			return fullDataset[(currentIndex - 1 + fullDataset.length) % fullDataset.length];
		}
	},
});
```

This is a non-breaking change - when `onNavigate` is not provided, both components fall back to their existing DOM-based navigation behavior.
