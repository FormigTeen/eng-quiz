FROM node:16-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

# Copy only package manifest; lock file optional
COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["npm", "start"]
