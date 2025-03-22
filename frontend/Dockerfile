FROM node:22

WORKDIR /app
COPY . .

RUN npm install && npm run build

# Install a lightweight static server
RUN npm install -g serve

EXPOSE 8080

# Serve your compiled build with React Router support
CMD ["serve", "-s", "dist", "-l", "8080"]
