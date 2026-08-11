FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY frontend ./frontend
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 DATABASE_PATH=/app/data/exam-system.db
COPY package.json ./
COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 4173
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:4173/api/health || exit 1
CMD ["npm", "start"]
