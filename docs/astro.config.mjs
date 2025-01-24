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
					textMarkers: {
						markBackground: "#a4623333",
						markBorderColor: "#a46233",
					},
				},
				minSyntaxHighlightingColorContrast: 10,
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
				discord: "https://melt-ui.com/discord",
				github: "https://github.com/melt-ui/next-gen"
			},
			sidebar: [
				{
					label: "Getting Started",
					items: [
						{
							label: "Installation",
							link: "/guides/installation",
						},
						{
							label: "Styling",
							link: "/guides/styling",
						},
						{
							label: "Best Practices",
							link: "/guides/best-practices",
						},
					],
				},
				{
					label: "Components",
					autogenerate: {
						directory: "components",
					},
				},
				{
					label: "Reference",
					items: [
						{
							label: "API Reference",
							link: "/reference/api",
						},
					],
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
