FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 ARRIVO_DB_PATH=/data/arrivo.sqlite
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile
COPY server ./server
COPY public ./public
COPY drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:4173/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
