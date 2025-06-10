import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// global test settings that are not workspace dependant
		coverage: {
			provider: "v8",
			include: ["src/**/*.{svelte,js,ts}"],
		},
		projects: [
			{
				// Client-side tests (Svelte components)
				extends: "./vite.config.ts",
				test: {
					name: "client",
					environment: "browser",
					testTimeout: 2000,
					browser: {
						enabled: true,
						provider: "playwright",
						// Multiple browser instances for better performance
						// Uses single Vite server with shared caching
						instances: [{ browser: "chromium" }, { browser: "firefox" }],
					},
					include: ["src/**/*.{test,spec}.svelte.{js,ts}"],
					exclude: ["src/lib/server/**", "src/**/*.ssr.{test,spec}.{js,ts}"],
					setupFiles: ["./vitest-setup-client.ts"],
				},
			},
			{
				// SSR tests (Server-side rendering)
				extends: "./vite.config.ts",
				test: {
					name: "ssr",
					environment: "node",
					include: ["src/**/*.ssr.{test,spec}.{js,ts}"],
				},
			},
			{
				// Server-side tests (Node.js utilities)
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.{test,spec}.svelte.{js,ts}", "src/**/*.ssr.{test,spec}.{js,ts}"],
				},
			},
		],
	},
});
