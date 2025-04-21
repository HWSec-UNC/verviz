FROM node:22

WORKDIR /app
COPY . .

RUN npm install

RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

EXPOSE 8000
CMD ["node", "server.js"]

