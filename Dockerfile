# A7-FE (прод веб-версия Wanmax) — образ для Dokploy.
# CRA (react-scripts): REACT_APP_* вшивается на этапе BUILD → образ прод ≠ образ стенд
# (разный REACT_APP_API_URL). Значение задаётся build-arg'ом в Dokploy на каждую среду.
FROM node:18-bullseye AS build
WORKDIR /app

ARG REACT_APP_API_URL=https://api.wanmax.io
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime: статика через nginx ---
FROM nginx:1.27-alpine
# SPA-роутинг: любые пути → index.html.
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
