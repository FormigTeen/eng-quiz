FROM node:16-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package*.json ./

# Prefer ci if lockfile exists, fallback to install
RUN npm ci --omit=dev || npm install --production || true

COPY . .

CMD ["npm", "start", "--", "/app/services/*.service.js", "/app/services/**/*.service.js"]
