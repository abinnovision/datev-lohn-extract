import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@internal/datev-lohn-extract-core#unit",
		include: ["src/**/*.spec.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.ts", "src/types.ts"],
		},
	},
});
