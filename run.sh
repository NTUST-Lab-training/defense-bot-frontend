#!/usr/bin/env bash
set -e

# ===== Defense-Bot Frontend 一鍵 Docker 部署腳本 =====

IMAGE_NAME="defense-bot-frontend"
CONTAINER_NAME="defense-bot-frontend"
PORT=80

cd "$(dirname "$0")"

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
  echo "❌ 未偵測到 Docker，請先安裝 Docker"
  exit 1
fi

# 停止並移除舊容器（若存在）
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "🛑 移除舊容器..."
  docker rm -f "$CONTAINER_NAME"
fi

echo "🔨 建置 Docker 映像檔..."
docker build -t "$IMAGE_NAME" .

echo "🚀 啟動容器（Port ${PORT}）..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:80" \
  --restart unless-stopped \
  "$IMAGE_NAME"

echo ""
echo "✅ 部署完成！前端已在 http://localhost:${PORT} 上運行"
echo "   查看日誌：docker logs -f ${CONTAINER_NAME}"
echo "   停止服務：docker rm -f ${CONTAINER_NAME}"
