export const siteConfig = {
	name: "Melt UI",
	url: "https://melt-ui.com",
	description: "",
	links: {
		x: "https://x.com/thomasglopes",
		github: "https://github.com/melt-ui/melt-ui",
		releases: "https://github.com/melt-ui/melt-ui/releases",
	},
	author: "Thomas G. Lopes",
	keywords:
		"melt ui, melt, ui, headless, svelte, runes, svelte 5, shadcn, shadcn-svelte, radix-svelte, radix",
	ogImage: {
		url: "https://melt-ui.com/og.png",
		width: "1200",
		height: "630",
	},
	license: {
		name: "MIT",
		url: "https://github.com/melt-ui/melt-ui/blob/main/LICENSE",
	},
};

export type SiteConfig = typeof siteConfig;
