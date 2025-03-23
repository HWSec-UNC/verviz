# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install && npm run build

# Copy rest of the files and build output
COPY . .
RUN npm run build

# Install a production-grade HTTP server (e.g., serve)
RUN npm install -g serve

# Expose the port serve runs on
EXPOSE 8080

# Serve the production build
CMD ["serve", "-s", "dist", "-l", "8080"]
