import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import icons from "unplugin-icons/vite";

// https://astro.build/config
export default defineConfig({
	site: "https://next.melt-ui.com",
	integrations: [
		starlight({
			title: "Melt UI",
			expressiveCode: {
				themes: ["vesper", "material-theme-lighter"],
				styleOverrides: {
					borderWidth: "1px",
					borderRadius: "0.5rem",
					borderColor: "var(--sl-color-gray-5)",
					frames: {
						shadowColor: "transparent",
					},
				},
			},
			components: {
				PageTitle: "./src/components/page-title.astro",
			},
			customCss: [
				// Path to your Tailwind base styles:
				"./src/tailwind.css",
				"@fontsource-variable/inter",
				"@fontsource-variable/fira-code",
			],
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
				replacesTitle: true,
			},
			social: {
				github: "https://github.com/melt-ui/melt-ui",
			},
			sidebar: [
				{
					label: "Overview",
					items: [
						{
							label: "Installation",
							link: "/guides/example/",
						},
						{
							label: "Getting Started",
							link: "/guides/example/a",
						},
						{
							label: "Builders vs Components",
							link: "/guides/example/a",
						},
					],
				},
				{
					label: "Core concepts",
					items: [
						{
							label: "Simplicity",
							link: "/guides/example/a",
						},
						{
							label: "Flexibility",
							link: "/guides/example/a",
						},
						{
							label: "Full control",
							link: "/guides/example/a",
						},
					],
				},
				{
					label: "Components",
					autogenerate: {
						directory: "components",
					},
				},
			],
		}),
		tailwind({
			// Disable the default base styles:
			applyBaseStyles: false,
		}),
		svelte(),
		icons({ compiler: "astro" }),
	],
	vite: {
		plugins: [icons({ compiler: "svelte" })],
	},
});
