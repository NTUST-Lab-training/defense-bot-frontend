# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# 構建時注入 API 位址（透過 nginx 反代，前端直接用相對路徑）
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# 複製自訂 nginx 設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 複製構建產物
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
