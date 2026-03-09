FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
ENV PORT=80

EXPOSE 80

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]