FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY scripts ./scripts
COPY tests/seed-preview.mjs ./tests/seed-preview.mjs
COPY drizzle ./drizzle
COPY dist ./dist
ENV ARRIVO_DB_PATH=/app/arrivo.sqlite
ENV ARRIVO_HOST=0.0.0.0
EXPOSE 4173
CMD ["node", "scripts/dev.mjs"]
