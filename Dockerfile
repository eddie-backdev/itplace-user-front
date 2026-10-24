FROM node:24.18.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24.18.0-bookworm-slim AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_BASE_URL=https://userapi.itplace.click/
ARG NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
ARG NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://userapi.itplace.click/oauth2/authorization/kakao
ARG NEXT_PUBLIC_CONTACT_EMAIL=noreply.itplace@gmail.com
ARG NEXT_PUBLIC_BENEFIT_CHAT_ENABLED=true
ARG NEXT_DEPLOYMENT_ID
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL \
    NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=$NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY \
    NEXT_PUBLIC_KAKAO_REDIRECT_URI=$NEXT_PUBLIC_KAKAO_REDIRECT_URI \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_BENEFIT_CHAT_ENABLED=$NEXT_PUBLIC_BENEFIT_CHAT_ENABLED \
    NEXT_DEPLOYMENT_ID=$NEXT_DEPLOYMENT_ID

RUN test -n "$NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY" \
    && test -n "$NEXT_PUBLIC_KAKAO_REDIRECT_URI" \
    && npm run build

FROM node:24.18.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    USER_API_BASE_URL=https://userapi.itplace.click/
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
