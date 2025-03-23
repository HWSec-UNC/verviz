# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy only frontend directory contents
COPY ./frontend/ .

# Install deps and build
RUN npm install && npm run build

# Install static file server
RUN npm install -g serve

# Expose port and serve
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
