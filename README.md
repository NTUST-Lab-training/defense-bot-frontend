#  Defense-Bot Frontend (口試佈告管家 - 前端)

這是一個基於 React + Vite 開發的智慧口試佈告生成系統前端。透過對話式介面 (Chat UI)，引導學生輸入口試地點、時間與委員名單，並與後端 AI Agent (Dify) 進行串接，最終一鍵生成排版精美的口試佈告 PowerPoint (PPTX)。

---

##  技術棧 (Tech Stack)

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

*** `run.sh` 腳本在背後做了什麼？**
1. 自動檢查是否有 `.env` 檔案，若無則複製 `.env.example` 生成預設設定。
2. 呼叫 `docker-compose up -d --build`，將 React 編譯為靜態檔案，並放入輕量級 Nginx 容器中運行。
3. 服務啟動後，預設運行於機器的 `Port 80`。

### 3. 環境變數設定 (Environment Variables)
若後端 API 的 IP 或網域有變動，請修改專案根目錄下的 `.env` 檔案，修改後再次執行 `./run.sh` 即可套用新設定：

```env
# 後端 API 的基礎網址 (請填入整合測試機或正式機的後端 IP 與 Port)
VITE_API_BASE_URL=http://192.168.109.128:8088
```

---

##  目錄結構說明 (Folder Structure)

本專案採用標準 Vite React 目錄結構，已移除不必要的預設檔案，並結合 Docker 部署配置：

```text
defense-bot-frontend/
├── public/               # 靜態資源 (如 favicon.ico)
├── src/
│   ├── assets/           # 圖片、SVG 等內部資源
│   ├── pages/            # 系統核心頁面
│   │   ├── Login.jsx     # 登入與身分綁定頁面 (存取 localStorage)
│   │   ├── Dashboard.jsx # 個人儀表板 (顯示個人資訊與歷史產出)
│   │   └── ChatRoom.jsx  # AI 對話互動區 (核心 Agent 介面)
│   ├── App.jsx           # 前端路由設定 (Routes)
│   ├── main.jsx          # React 應用程式進入點
│   └── index.css         # Tailwind 基礎樣式與全域 CSS
├── .env.example          # 環境變數範本檔 (請勿將真實 .env 推上 Git)
├── docker-compose.yml    # Docker 服務配置檔
├── Dockerfile            # Nginx 多階段構建腳本
├── run.sh                # 一鍵啟動腳本
├── tailwind.config.js    # Tailwind CSS 樣式配置檔
└── package.json          # 專案依賴套件清單
```

---

##  API 規格與開發指南 (API Documentation)

本系統採取**「輕量化狀態、零信任驗證」**的設計模式。前端只需負責介面渲染，核心業務邏輯與 AI 驗證皆由後端 FastAPI 處理。

### 1. API 文件參考 (Swagger UI)
所有 API 端點的詳細規格、請求格式 (Payload) 與回傳格式，請直接參考後端自動生成的互動式 API 文件：
 **http://[後端IP]:8088/docs**

### 2. 核心 API 列表
前端主要串接以下三支核心 API：
* `GET /api/v1/students/me`：取得登入學生的基本資料與指導教授。
* `GET /api/v1/defense/history`：取得該學生過去生成的口試佈告歷史紀錄與下載連結。
* `POST /api/v1/chat`：傳送對話訊息至 Dify AI Agent。需攜帶 `query` 與 `conversation_id` 參數。

### 3. 全域身分驗證規範 (Authentication)
* **狀態儲存**：使用者登入後，前端會將學號 (`studentId`) 等資訊存入瀏覽器的 `localStorage` 中。
* **Header 攔截**：後續**所有**與後端溝通的 API 請求，都必須在 HTTP Headers 中攜帶 `x-student-id`，供後端進行身分識別與資料隔離。
  ```javascript
  headers: { 
    'Content-Type': 'application/json',
    'x-student-id': localStorage.getItem('studentId')
  }
  ```

### 4. 特殊 UI 渲染邏輯 (檔案下載卡片)
前端會攔截 `ChatRoom.jsx` 中 AI 回傳的文字串流。若透過正則表達式偵測到特定格式的 Markdown 下載連結（例如 `[DOWNLOAD](http://.../xxx.pptx)`），前端會隱藏原本的 Markdown 語法，將該段落轉換為排版精美的「📥 點我下載 PPT」互動卡片按鈕。

---

