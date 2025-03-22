# Stage 1: Build the frontend with Vite
FROM node:22 as build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: Custom nginx config for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

