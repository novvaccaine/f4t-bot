FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npx -y playwright install --with-deps chromium

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
