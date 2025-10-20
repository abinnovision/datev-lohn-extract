import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		HTTP_PORT: z.string().default("3000").transform(Number),
		APP_BASE_URL: z
			.string()
			.default("http://localhost:3000/api/v1")
			.pipe(z.url({ normalize: true }))
			.transform((url) => new URL(url)),

		// Limits
		APP_MAX_FILE_SIZE: z.number().default(10 * 1024 * 1024), // 10MB
		APP_PROCESSING_TIMEOUT: z.number().default(15 * 1000), // 15s
		APP_MAX_ZIP_SIZE: z.number().default(50 * 1024 * 1024), // 50MB
		APP_MAX_PAGE_COUNT: z.number().default(1000),
	},

	runtimeEnv: process.env,
});
