# Curated build output is the context. No npm/network step or COPY of the checkout/secrets.
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
WORKDIR /app
COPY --chown=node:node assess-job.cjs job-main.mjs ./
ENV NODE_ENV=production
USER node
ENTRYPOINT ["node", "/app/job-main.mjs"]
