import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import icons from "unplugin-icons/vite";

import tailwindcss from "@tailwindcss/vite";

const isDev = process.env.NODE_ENV === "development";

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
			social: [
				{ icon: "discord", label: "Discord", href: "https://melt-ui.com/discord" },
				{ icon: "github", label: "GitHub", href: "https://github.com/melt-ui/next-gen" },
			],
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
							label: "How To Use",
							link: "/guides/how-to-use",
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
			head: [
				{
					tag: "script",
					attrs: {
						src: "https://umami.thomas.rocks/script.js",
						"data-website-id": "5a576ec6-f2d5-448e-88bc-75d88e6b9890",
						defer: true,
					},
				},
			],
		}),
		svelte(),
		icons({ compiler: "astro" }),
	],
	vite: {
		plugins: [icons({ compiler: "svelte" }), tailwindcss()],
		server: {
			allowedHosts: isDev ? true : undefined,
		},
	},
});
