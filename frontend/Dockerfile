# ---------- FRONTEND ----------

# Start with a lightweight Node.js 20 image.
FROM node:20-alpine AS build

# Frontend files will be copied into WORKDIR (it will automatically create if not exist).
WORKDIR /app

# Copy app package JSON files into the container.
COPY package*.json ./

# Install all project dependencies (clean install).
RUN npm ci

# Copy all frontend code into the container.
COPY . .

# Build the production-ready static files.
RUN npm run build

# Serve the static files via Nginx.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

# Export port 80 inside container.
EXPOSE 80

# Start the Nginx server and keep it running in the foreground.
# The container stays alive as long as Nginx is running.
CMD ["nginx", "-g", "daemon off;"]