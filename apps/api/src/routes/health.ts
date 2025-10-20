import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";

const healthRoutes = new Hono();

/**
 * Health check response schema
 * Defined inline with route for better co-location
 */
const HealthResponseSchema = z.object({
	status: z.string().describe("Health status"),
});

/**
 * GET /health
 * Basic health check endpoint
 */
healthRoutes.get(
	"/",
	describeRoute({
		tags: ["Health"],
		summary: "Health check",
		responses: {
			200: {
				description: "Service is healthy",
				content: {
					"application/json": {
						schema: resolver(HealthResponseSchema),
					},
				},
			},
		},
	}),
	(c) => c.json({ status: "ok" }),
);

export { healthRoutes };
