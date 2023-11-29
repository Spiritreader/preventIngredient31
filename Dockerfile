FROM node:20.1.0-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
ENTRYPOINT [ "node", "server.js" ]