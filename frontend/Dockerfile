FROM node:lts

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

# RUN npm run db:init

ENTRYPOINT [ "npm", "run", "start" ]