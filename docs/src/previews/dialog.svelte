<script lang="ts">
  import Preview from "@components/preview.svelte";
  import { usePreviewControls } from "@components/preview-ctx.svelte";
  import { Dialog } from "melt/builders";

  const controls = usePreviewControls({});

  const dialog = new Dialog({});
</script>

<Preview>
  <div class="flex justify-center">
    <div {...dialog.root} class="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      Dialog Preview
    </div>
  </div>
</Preview>