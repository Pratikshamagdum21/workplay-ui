# Stage 1: Build the Angular application
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built Angular output to Nginx html directory
COPY --from=build /app/dist/work-pay/browser /usr/share/nginx/html

# Copy custom Nginx config template for SPA routing and API proxy
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Render provides PORT env var; default to 80 for local use
ENV PORT=80
ENV API_URL=http://localhost:8080

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
