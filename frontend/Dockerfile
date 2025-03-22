# Stage 1: Build the app with Vite
FROM node:22 as build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve with NGINX (OpenShift-friendly)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Change permissions to allow non-root container to run
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R 1001:0 /usr/share/nginx/html

# Set a non-root user for OpenShift (uid 1001 is commonly used in OpenShift-compatible containers)
USER 1001

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
