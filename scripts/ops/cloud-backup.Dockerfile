# Reviewed Node and PostgreSQL17 client images. No secret or source checkout COPY.
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS node
FROM postgres:17.11-bookworm@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5
COPY --from=node /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --chown=root:root --chmod=0444 backup.cjs backup-main.cjs manifest.json ./
COPY --chown=root:root --chmod=0555 age /usr/local/bin/age
RUN mkdir -m 0700 /work && chown postgres:postgres /work
USER postgres
ENTRYPOINT ["node", "/app/backup-main.cjs"]
# No CMD --run: the default image reads no secret and uploads nothing.
