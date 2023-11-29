FROM node:slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .


FROM node:alpine

WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --only=production
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT [ "node", "server.js" ]
