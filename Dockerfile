# A7-FE (прод веб-версия Wanmax) — образ для Dokploy.
# Vite (R-54; раньше CRA): REACT_APP_API_URL вшивается на этапе BUILD → образ прод ≠ образ стенд.
# Значение задаётся build-arg'ом в Dokploy на каждую среду (имя переменной прежнее — envPrefix).
FROM node:18-bullseye AS build
WORKDIR /app

ARG REACT_APP_API_URL=https://api.wanmax.io
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- runtime: статика через nginx ---
FROM nginx:1.27-alpine
# SPA-роутинг, сжатие и кэш (R-53) — в nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
