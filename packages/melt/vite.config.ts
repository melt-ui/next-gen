import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ["src/**/*.{test,test.svelte,spec,spec.svelte}.{js,ts}"],
		environment: "jsdom",
	},
});
