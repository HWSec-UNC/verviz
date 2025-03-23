FROM node:22

WORKDIR /app

# Use files from the current context, which is already frontend/
COPY . .

RUN npm install && npm run build

RUN npm install -g serve

EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]
