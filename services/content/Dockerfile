# Development image for Strapi
FROM node:22-alpine
# Installing libvips-dev for sharp compatibility and build deps
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Enable Yarn classic
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /opt/app
COPY . .

# Install dependencies: prefer frozen-lockfile when yarn.lock is present
RUN yarn config set network-timeout 600000 -g \
  && if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install --no-lockfile; fi

RUN chown -R node:node /opt/app
USER node

# Pre-build admin once to speed up first boot
RUN ["yarn", "build"]
EXPOSE 1337
CMD ["yarn", "develop"]
