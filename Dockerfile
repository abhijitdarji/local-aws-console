
FROM node:18-slim AS build
WORKDIR /app
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm ci
COPY ./ /app
RUN npm run build

FROM node:18-slim AS final
WORKDIR /app
COPY --from=build /app/dist .
COPY --from=build /app/node_modules ./node_modules
ENTRYPOINT [ "node", "server.js" ]
