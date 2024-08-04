import starlightPlugin from "@astrojs/starlight-tailwind";

// Generated color palettes
const accent = {
  '50': '#fff9ed',
        '100': '#fef2d6',
        '200': '#fce0ac',
        '300': '#f9c978',
        '400': '#f7b155',
        '500': '#f38d1c',
        '600': '#e47312',
        '700': '#bd5711',
        '800': '#964516',
        '900': '#793a15',
        '950': '#411c09',};
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
	950: "#090909",
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
