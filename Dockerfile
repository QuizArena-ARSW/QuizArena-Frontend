# ==========================================================
# Dockerfile del frontend React (Vite)
#
# Compila la SPA y la sirve con Nginx. Las URLs del backend se inyectan
# en tiempo de COMPILACION (Vite las incrusta en el bundle), por eso van
# como argumentos de build.
# ==========================================================

# ---------- Etapa 1: compilar ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# URLs del backend (se pasan al construir la imagen)
ARG VITE_API_URL=http://localhost:8080
ARG VITE_WS_URL=http://localhost:8081/ws-juego
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY . .
RUN npm run build

# ---------- Etapa 2: servir ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
