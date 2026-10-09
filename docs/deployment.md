# Deployment

The repository provides a Docker Compose deployment for a single backend
replica and a static frontend. The backend uses SQLite, so the deployment
mounts a named volume at `/app/tmp` and runs database migrations at startup.

## Publish release images

The GitHub Actions workflow runs checks for pushes and pull requests to
`main`. When a `v*` tag is pushed, it publishes backend and frontend images to
GitHub Container Registry after verification succeeds:

- `ghcr.io/<owner>/<repository>-backend:<tag>`
- `ghcr.io/<owner>/<repository>-frontend:<tag>`

## First deployment

On the deployment host, install Docker Engine and the Docker Compose plugin.
Copy `deploy/.env.example` to `deploy/.env`, then set:

- `IMAGE_NAMESPACE` to the lowercase `ghcr.io/<owner>/<repository>` prefix
- `IMAGE_TAG` to the release tag, or `latest`
- `APP_KEY` to a generated, private, stable AdonisJS key
- `APP_URL` to the public site URL
- `HTTP_PORT` to the port exposed to the host

For a private GHCR package, authenticate the host with a read-only package
token before pulling images. Then start the services:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml pull
docker compose --env-file deploy/.env -f deploy/compose.yml up -d
```

The frontend serves the SPA and proxies `/api/` to the backend. Put the HTTP
port behind a TLS reverse proxy for public access. The backend `/health` and
frontend `/healthz` endpoints are used by container health checks.

## SQLite operations

The `sqlite-data` named volume is the production database. Keep it when
recreating or updating containers; never run `docker compose down -v` on a
deployment with data you need. SQLite is intended here for one backend replica
with persistent local storage. Do not scale the backend across hosts or
containers sharing a network filesystem.

Back up the database regularly using SQLite's online backup mechanism or a
quiesced volume snapshot, and store backups outside the host. Verify restore
procedures before relying on a backup. The application does not automatically
seed demo records in production.

## Updates and remaining host setup

After a release tag is pushed and images are published, update `IMAGE_TAG` on
the host and run `docker compose pull` followed by `docker compose up -d`.
Migrations run before the backend starts. Image publication is automated;
remote host rollout is intentionally not wired until a deployment host and
credentials are selected.
