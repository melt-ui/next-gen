<script lang="ts">
	import MobileNav from "../mobile-nav/mobile-nav.svelte";
	// import ThemeDropdown from "./theme-dropdown.svelte";
	import { GitHubIcon } from "$lib/icons/index.js";
	import { siteConfig } from "$lib/config";
</script>

<div class="flex items-center justify-end lg:flex-1">
	<!-- <ThemeDropdown /> -->
	<a
		href={siteConfig.links.github}
		target="_blank"
		aria-label="view this project on github"
	>
		<GitHubIcon class="size-5" />
	</a>
	<MobileNav />
</div>
