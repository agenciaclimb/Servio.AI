import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
	},
	css: {
		// Provide inline PostCSS config to avoid file loading/parsing
		postcss: {
			plugins: [],
		},
	},
});
