# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# ─── 2. Build ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}

ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID}

ARG VITE_CLARITY_PROJECT_ID
ENV VITE_CLARITY_PROJECT_ID=${VITE_CLARITY_PROJECT_ID}

ARG VITE_ANALYTICS_ENABLED
ENV VITE_ANALYTICS_ENABLED=${VITE_ANALYTICS_ENABLED}

ARG VITE_API_LOGGER
ENV VITE_API_LOGGER=${VITE_API_LOGGER}

ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}

ARG VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT}

ARG VITE_SENTRY_TRACES_SAMPLE_RATE
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=${VITE_SENTRY_TRACES_SAMPLE_RATE}

RUN pnpm run build && \
    rm -rf node_modules src .vite

# ─── 3. Runtime ───────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN addgroup -S saku && adduser -S -G saku saku && \
    rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

COPY --chown=saku:saku nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=saku:saku /app/dist /usr/share/nginx/html

RUN chown -R saku:saku /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown saku:saku /var/run/nginx.pid

USER saku

EXPOSE 3301

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3301/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
