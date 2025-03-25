FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npx -y playwright install --with-deps chromium

CMD ["npm", "start"]
