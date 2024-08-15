import starlightPlugin from "@astrojs/starlight-tailwind";

// Generated color palettes
const accent = {
	200: "#eebf87", // existing
	300: "#d59f6a", // new
	400: "#bc804d", // new
	500: "#a46233", // new
	600: "#945e00", // existing
	700: "#7a4e00", // new
	800: "#613d00", // new
	900: "#482b00", // existing
	950: "#341e00", // existing
};

const gray = {
	100: "#f7f6f5",
	200: "#efedeb",
	300: "#c4c1bf",
	400: "#908a85",
	500: "#5c5752",
	600: "#4a4541", // New 600 shade added
	700: "#3c3733",
	800: "#2a2622",
	900: "#1a1816",
	950: "#0e0d0b", // New 950 shade added
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
