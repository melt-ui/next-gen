<script lang="ts">
  import Preview from "@components/preview.svelte";
  import { usePreviewControls } from "@components/preview-ctx.svelte";
  import { Select } from "melt/builders";

  const controls = usePreviewControls({});

  const select = new Select({});
</script>

<Preview>
  <div class="flex justify-center">
    <div {...select.root} class="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      Select Preview
    </div>
  </div>
</Preview>