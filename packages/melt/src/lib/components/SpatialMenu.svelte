<script lang="ts">
  import { SpatialMenu as SpatialMenuBuilder, type SpatialMenuProps } from "../builders/SpatialMenu.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props<T = unknown> = ComponentProps<SpatialMenuProps<T>> & {
    children: Snippet<[SpatialMenuBuilder<T>]>;
  };

  let { children, ...rest }: Props = $props();

  const spatialMenu = new SpatialMenuBuilder(rest);
</script>

{@render children(spatialMenu)}