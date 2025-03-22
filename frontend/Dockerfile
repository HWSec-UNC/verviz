# Stage 1: Build the React + Vite app
FROM node:22 as build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve with OpenShift-compatible NGINX
FROM nginx:1.25-alpine

# Remove default NGINX config and replace with custom
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copy built frontend files to NGINX html dir
COPY --from=build /app/dist /usr/share/nginx/html

# Make dirs writable for OpenShift
RUN mkdir -p /var/cache/nginx/client_temp && \
    chmod -R 777 /var/cache/nginx && \
    chmod -R 777 /usr/share/nginx/html

# OpenShift requires containers to run as arbitrary UID
# This works around that and avoids "Permission denied" errors
USER 1001

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
