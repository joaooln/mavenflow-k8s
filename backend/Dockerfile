FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
# the official image ships an unprivileged "node" user (uid 1000)
USER node
EXPOSE 3001
CMD ["node", "src/app.js"]
