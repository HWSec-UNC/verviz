# Use Node.js as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the backend server
CMD ["node", "server.js"]
