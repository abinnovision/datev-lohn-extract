# Build arguments
ARG node_version
ARG build_version
ARG build_commit

# Takes the pruned workspace from the 'out/<>' folder to install dependencies.
FROM node:${node_version}-alpine AS installer

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy the pruned workspace files
COPY .gitignore .yarnrc.yml ./
COPY out/api/json/ ./
COPY out/api/yarn.lock ./

RUN corepack enable && yarn install --immutable

COPY out/api/full/ ./

# This will build the api and all its dependencies.
RUN yarn turbo build --filter=@internal/app-api

# Install production dependencies
RUN yarn workspaces focus @internal/app-api --production

# Remove all unnecessary files which are not needed for the runtime.
RUN rm -rf .yarn .yarnrc.yml || true && \
    find . -type d -name .turbo -exec rm -rf {} + || true && \
    find . -type d -path '*/.cache/turbo' -exec rm -rf {} + || true

# Final image which runs the application.
FROM node:${node_version}-alpine AS runner

# Re-declare build arguments for this stage
ARG build_version
ARG build_commit

WORKDIR /app

COPY --from=installer --chown=node:node /app .

# Use an user with a non-root UID/GID to run the application.
USER node
ENV NODE_ENV=production
ENV BUILD_VERSION=${build_version}
ENV BUILD_COMMIT=${build_commit}

EXPOSE 3000

CMD ["sh", "-c", "node apps/api/dist/index.js"]
