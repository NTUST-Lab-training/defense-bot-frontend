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

# 安裝 openssl 並產生自簽憑證（測試環境使用）
# 正式環境（GCP）請改用 Let's Encrypt 或 GCP Managed Certificate
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/key.pem \
      -out  /etc/nginx/ssl/cert.pem \
      -subj "/CN=defense-bot/O=Defense-Bot/C=TW"

# 複製 nginx 設定模板（啟動時由 envsubst 替換 ${BACKEND_URL}）
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 複製構建產物
COPY --from=build /app/dist /usr/share/nginx/html

# 80：HTTP（僅用於重導向至 HTTPS）
# 443：HTTPS 主服務
EXPOSE 80 443

# nginx:alpine 官方映像內建 /docker-entrypoint.d/ 機制：
# 會自動對 /etc/nginx/templates/*.template 執行 envsubst，
# 輸出至 /etc/nginx/conf.d/，再啟動 nginx。
CMD ["nginx", "-g", "daemon off;"]
