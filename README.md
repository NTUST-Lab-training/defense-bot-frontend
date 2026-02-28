#  Defense-Bot Frontend (口試佈告管家 - 前端)

這是一個基於 React + Vite 開發的智慧口試佈告生成系統前端。透過對話式介面 (Chat UI)，引導學生輸入口試地點、時間與委員名單，並與後端 AI Agent (Dify) 進行串接，最終一鍵生成排版精美的口試佈告 PowerPoint (PPTX)。

---

## 🛠 技術棧 (Tech Stack)

* **核心框架**: React 19 + Vite
* **路由管理**: React Router DOM v7
* **樣式排版**: Tailwind CSS (PostCSS)
* **容器化部署**: Docker + Docker Compose + Nginx

---

##  一鍵部署與啟動 (One-Click Deployment)

本專案已全面導入 Docker 容器化與腳本自動化部署。您不需要在本地安裝 Node.js，只要有 Docker 環境即可一鍵架設完畢。

### 1. 環境要求
請確保您的部署機器（或測試 VM）已安裝 [Docker](https://docs.docker.com/get-docker/) 與 Docker Compose。

### 2. 一鍵啟動 (推薦)
請在終端機進入專案根目錄，並執行啟動腳本：

```bash
# 1. 賦予腳本執行權限 (初次執行需要)
chmod +x run.sh

# 2. 執行一鍵啟動
./run.sh
```

** `run.sh` 腳本在背後做了什麼？**
1. **環境變數初始化**：自動檢查目錄下是否有 `.env` 檔案。如果沒有，會自動複製一份 `.env.example` 生成預設的 `.env`。
2. **容器建構與啟動**：呼叫 `docker-compose up -d --build`，將 React 專案編譯為靜態檔案，並放入輕量級的 Nginx 容器中運行。
3. **完成啟動**：前端服務將預設運行於機器的 `Port 80`。

### 3. 環境變數設定 (Environment Variables)
若後端 API 的 IP 或網域有變動，請直接修改專案根目錄下的 `.env` 檔案（若無此檔案請執行 `./run.sh` 自動生成），修改完成後再次執行 `./run.sh` 即可套用新設定：

```env
# 後端 API 的基礎網址 (請填入整合測試機或正式機的後端 IP 與 Port)
VITE_API_BASE_URL=[http://localhost:8088](http://localhost:8088)
```

---

##  目錄結構說明 (Folder Structure)

本專案採用標準 Vite React 目錄結構，並結合 Docker 部署配置：

```text
defense-bot-frontend/
├── public/               # 靜態資源 (如 favicon)
├── src/
│   ├── assets/           # 圖片、SVG 等資源
│   ├── pages/            # 系統核心頁面
│   │   ├── Login.jsx     # 登入與身分綁定頁面 (存取 localStorage)
│   │   ├── Dashboard.jsx # 個人儀表板 (顯示個人資訊與歷史產出)
│   │   └── ChatRoom.jsx  # AI 對話互動區 (核心 Agent 介面)
│   ├── App.jsx           # 前端路由設定 (Routes)
│   ├── main.jsx          # React 應用程式進入點
│   └── index.css         # Tailwind 基礎樣式與全域 CSS
├── .env.example          #  環境變數範本檔 (請勿將真實 .env 推上 Git)
├── docker-compose.yml    #  Docker 服務配置檔
├── Dockerfile            #  Nginx 多階段構建腳本
├── run.sh                #  一鍵啟動腳本
├── eslint.config.js      # ESLint 程式碼檢查規則
├── tailwind.config.js    # Tailwind CSS 樣式配置檔
└── package.json          # 專案依賴套件清單
```

---

## 🔌 API 串接與資料流規範 (Data Flow & Integration)

本系統前端採取**「輕量化狀態、零信任驗證」**的設計模式，核心業務邏輯皆由後端與 Dify Agent 處理。

### 1. 模擬登入與狀態保存 (`Login.jsx` & `Dashboard.jsx`)
* **狀態儲存**：登入後，前端會將 `studentId` 等資訊存入瀏覽器的 `localStorage` 中。
* **驗證機制**：後續所有與後端溝通的 API 請求，都**必須**在 Headers 中攜帶 `x-student-id`，供後端進行身分識別。

### 2. AI 核心對話機制 (`ChatRoom.jsx`)
負責與後端 FastAPI 對話代理端點進行溝通，維持上下文記憶。
* **請求端點**: `POST /api/v1/chat`
* **對話狀態維持**: 每次請求完成後，前端會將後端回傳的 `conversation_id` 更新至 React State，確保 Dify Agent 能記住多輪對話的上下文。

### 3. 特殊 UI 渲染邏輯 (檔案下載卡片)
前端會攔截並監聽 AI 回傳的文字，若透過正則表達式偵測到特定格式的 Markdown 下載連結（例如 `[DOWNLOAD](http://.../xxx.pptx)`），前端會隱藏原本的 Markdown 語法，將該段落轉換為排版精美的互動卡片，提供最佳的用戶體驗。

---
