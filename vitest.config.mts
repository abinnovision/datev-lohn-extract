import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      all: true,
      include: ["{apps,packages}/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/types.ts",
        "**/index.ts",
        "apps/*/src/index.ts", // Exclude entry points
      ],
      reporter: [["lcovonly", { projectRoot: "./" }], "text"],
    },
  },
});
