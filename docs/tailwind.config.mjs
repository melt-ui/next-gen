import starlightPlugin from "@astrojs/starlight-tailwind";

// Generated color palettes
const accent = {
	200: "#edc086",
	600: "#925f00",
	900: "#472c00",
	950: "#341f00",
};
const gray = {
	100: "#f6f6f6",
	200: "#eeeeee",
	300: "#c2c2c2",
	400: "#8b8b8b",
	500: "#585858",
	600: "#484848",
	700: "#383838",
	800: "#272727",
	900: "#181818",
};

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: { accent, gray },
			fontFamily: {
				sans: ["Inter Variable", "sans-serif"],
				mono: ["Fira Code Variable", "monospace"],
			},
		},
	},
	plugins: [starlightPlugin()],
};
