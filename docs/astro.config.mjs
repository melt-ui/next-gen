import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Melt UI",
			customCss: [
				// Path to your Tailwind base styles:
				"./src/tailwind.css",
			],
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
				replacesTitle: true,
			},
			social: {
				github: "https://github.com/withastro/starlight",
			},
			sidebar: [
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{
							label: "Example Guide",
							link: "/guides/example/",
						},
					],
				},
				{
					label: "Reference",
					autogenerate: {
						directory: "reference",
					},
				},
				{
					label: "Builders",
					autogenerate: {
						directory: "builders",
					},
				},
			],
		}),
		tailwind({
			// Disable the default base styles:
			applyBaseStyles: false,
		}),
		svelte(),
	],
});
