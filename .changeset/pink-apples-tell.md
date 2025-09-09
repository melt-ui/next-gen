---
"melt": patch
---

Fix `onNavigate` callback behavior in Combobox and Select components

Previously, the `onNavigate` callback would only handle custom navigation and never fall back to default behavior when returning `null`. Now correctly implements the documented behavior:

- When `onNavigate` returns a value: uses that value for navigation
- When `onNavigate` returns `null`: falls back to default DOM-based navigation

This allows for more flexible navigation handling, such as selective override of navigation behavior in specific scenarios while maintaining default behavior in others.
