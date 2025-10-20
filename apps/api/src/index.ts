/**
 * DATEV Lohn Extract REST API
 *
 * A REST service for extracting structured data from DATEV PDF salary statements.
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";

import { env } from "./env.js";
import { extractRoutes } from "./routes/extract.js";
import { healthRoutes } from "./routes/health.js";

// Create Hono app
const mainApp = new Hono();

// Middleware
mainApp.use("*", logger());

// API v1 routes
mainApp.route("/health", healthRoutes);
mainApp.route("/extract", extractRoutes);

// OpenAPI spec endpoint
mainApp.get(
	"/openapi.json",
	openAPIRouteHandler(mainApp, {
		documentation: {
			openapi: "3.0.0",
			info: {
				title: "DATEV Lohn Extract API",
				version: "0.0.0",
				description:
					"REST API for extracting structured data from DATEV PDF salary statements.",
			},
			servers: [
				{
					url: env.APP_BASE_URL.toString(),
				},
			],
			tags: [
				{
					name: "Health",
					description: "Health check and readiness endpoints",
				},
				{
					name: "Extract",
					description: "PDF extraction and processing endpoints",
				},
			],
		},
	}),
);

// Start server
const port = env.HTTP_PORT;

console.log(`Server starting on ${env.APP_BASE_URL}`);
console.log(`OpenAPI spec: ${env.APP_BASE_URL}/openapi.json`);

const app = new Hono().basePath(env.APP_BASE_URL.pathname).route("/", mainApp);

serve({ fetch: app.fetch, port });
