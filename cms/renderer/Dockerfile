FROM node:22-bookworm-slim
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps firefox && rm -rf /var/lib/apt/lists/*
COPY server.mjs ./
ENV NODE_ENV=production PORT=3000
USER node
CMD ["node", "server.mjs"]
