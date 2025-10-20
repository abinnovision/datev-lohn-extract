import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@internal/api#unit",
		include: ["src/**/*.spec.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.ts", "src/index.ts"],
		},
	},
});
