# Saku Finance Admin

Admin dashboard frontend for Saku Finance, built with React, TypeScript, Vite, Tailwind CSS, and an Nginx production runtime.

## Features

- Admin dashboard for users, wallets, transactions, budgets, subscriptions, categories, split bills, and AI processing logs
- Responsive operational UI for authenticated finance workflows
- Server-side Nginx fallback for SPA routing
- Docker-ready static runtime
- Optional analytics and Sentry browser monitoring

## Requirements

- Node.js 22+
- pnpm

## Environment

Create a local environment file from the example:

```bash
cp .env.example .env
```

Common frontend variables:

```bash
VITE_API_BASE_URL=/api/v1
VITE_GOOGLE_CLIENT_ID=
VITE_TURNSTILE_SITE_KEY=
VITE_GA_MEASUREMENT_ID=
VITE_CLARITY_PROJECT_ID=
VITE_ANALYTICS_ENABLED=false
VITE_API_LOGGER=false
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

Do not commit real `.env` files. Values prefixed with `VITE_` are baked into the browser bundle, so they must not contain private secrets.

## Development

```bash
pnpm install
pnpm dev
```

## Quality Checks

```bash
pnpm lint
pnpm build
```

## Production Runtime

The production image serves the Vite build with Nginx on internal port `3301`.

```bash
docker build -t saku-finance-admin:latest .
docker run -d \
  --name saku-finance \
  --restart unless-stopped \
  --network saku-finance \
  --network-alias saku-finance \
  --expose 3301 \
  saku-finance-admin:latest
```

When running behind a reverse proxy, attach the proxy to the `saku-finance` Docker network and route traffic to `http://saku-finance:3301`. Host port publishing is not required when the reverse proxy shares the same Docker network.

## CI/CD

The Jenkins pipeline builds, pushes, deploys, health-checks, and rolls back the Docker image when the new container fails its health check. Infrastructure values and public Vite build values are provided through Jenkins credentials, so webhook-triggered builds use the same configuration as manual builds.

Expected Jenkins credentials:

- `saku-finance-admin-env` as secret file containing the frontend `.env` values used at build time
- `docker-registry-host` as secret text, for example `registry.example.com` without protocol
- `docker-registry-username` as secret text
- `docker-registry-credentials` as secret text for the registry password or access token
- `ganipedia-host-ssh-server` as secret text
- `ganipedia-host-ssh-port` as secret text
- `ganipedia-host-ssh-user` as secret text
- `ganipedia-host-ssh-password` as secret text

Default deployment target:

- Docker network: `saku-finance`
- Container name: `saku-finance`
- Network alias: `saku-finance`
- Internal port: `3301`
- Health path: `/healthz`

## Project Structure

```text
src/              React application source
public/           Static public assets
nginx.conf        Production Nginx config
Dockerfile        Production image
docker-compose.yml Local/manual container runtime
Jenkinsfile       CI/CD pipeline
```
