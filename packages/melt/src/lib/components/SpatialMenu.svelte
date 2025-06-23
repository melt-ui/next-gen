<script lang="ts">
  import { SpatialMenu as Builder, type SpatialMenuProps } from "../builders/SpatialMenu.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<SpatialMenuProps> & {
    children: Snippet<[Builder]>;
  };

  let { children, ...rest }: Props = $props();

  const SpatialMenu = new SpatialMenu({});
</script>

{@render children(SpatialMenu)}