import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ["src/**/*.{test,test.svelte,spec,spec.svelte}.{js,ts}"],
		environment: "jsdom",
	},
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	resolve: process.env.VITEST
		? {
				conditions: ["browser"],
			}
		: undefined,
});
