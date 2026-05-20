# ✍️ WriteAI — AI Writing Assistant

**WriteAI** là một trợ lý viết lách thông minh, kết hợp trình soạn thảo Rich Text Editor (TipTap/ProseMirror) với sức mạnh AI đa nhà cung cấp (Groq, Google Gemini, Ollama). Nền tảng hỗ trợ soạn thảo, kiểm tra ngữ pháp real-time, dịch thuật đa ngôn ngữ, và nhiều công cụ AI chuyên biệt.

> **Bài tập lớn** — INT3509_3, Nhóm 7, Trường Đại học Công nghệ (UET - VNU)

---

## ✨ Tính năng nổi bật

### 📝 Trình soạn thảo (Rich Text Editor)
- **TipTap 3** với 12+ extensions: Bold, Italic, Heading, Highlight, Tables, Task Lists, Images, Links, Code Blocks, Text Align
- **Tìm kiếm & Thay thế** (`Ctrl+F` / `Ctrl+H`) với điều hướng bàn phím
- **Lưu tự động** (debounce 2s) vào IndexedDB (local-first, privacy by default)
- **Xuất đa định dạng**: PDF, Markdown, HTML, Plain Text

### 🤖 AI đa nhà cung cấp (Multi-Provider AI)
Hỗ trợ 3 nhà cung cấp AI, chuyển đổi linh hoạt trong Settings:

| Provider | Đặc điểm | Models |
|----------|----------|--------|
| **Groq Cloud** | Tốc độ suy luận nhanh nhất, miễn phí | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2 |
| **Google Gemini** | API miễn phí, hỗ trợ Gemma 4 | Gemini 2.5 Flash, Gemma 4 31B, Gemma 4 26B MoE |
| **Ollama (Local)** | Chạy offline trên máy, không cần API key | Mọi model đã cài (llama3, mistral, phi3...) |

- **Streaming Response** (SSE) — kết quả AI hiện từng chữ real-time
- **Facade Pattern** — 1 entry point `ai.js`, component không cần biết đang dùng provider nào
- **Post-processing** — `cleanAIOutput()` tự động lọc preamble, quotes thừa từ LLM

### 🔧 Bộ công cụ AI
- **AI Compose**: Soạn nội dung theo content type (Email, Blog, Essay, Report...) + tone + ngôn ngữ
- **AI Chat**: Hỏi đáp đa lượt với AI, toggle "Editor Context" để AI đọc văn bản đang soạn
- **AI Translate**: Dịch thuật 15+ ngôn ngữ, hoán đổi chiều dịch
- **AI Toolbar**: Summarize, Fix Grammar, Paraphrase, Expand, Shorten, Improve Readability, Change Tone
- **Inline AI Menu**: Bôi đen text → floating menu hiện ra → thao tác AI trực tiếp trên text
- **Expert Personas**: Chuyển góc nhìn viết (General, Tech Lead, Sales, Academic)
- **Markdown Rendering**: Kết quả AI render đẹp (headings, bold, lists, code blocks) thay vì raw text

### ✅ Kiểm tra ngữ pháp Real-time (Grammar Check)
- Tự động bật khi AI đã configured, debounce 5s
- Chỉ check paragraphs đã thay đổi (fingerprint comparison, tiết kiệm quota)
- Gạch chân wavy (ProseMirror Decorations) + hover tooltip với gợi ý sửa
- Grammar Panel tổng hợp toàn bộ lỗi + Fix All

### 🌐 Đa ngôn ngữ (i18n)
- **Tiếng Việt** / **English** — ~250 translation keys mỗi ngôn ngữ
- Toggle ngôn ngữ UI bất kỳ lúc nào qua Language Switcher

### 🗂️ Quản lý tài liệu
- Dashboard với Recent Documents, Favorites, Trash (soft delete)
- Template Gallery (Blog Post, Meeting Notes, Press Release, Job Description...)
- Full-text search trong sidebar

### 💼 Mô hình Freemium
- 10 lượt gọi AI/ngày (free tier), upgrade Pro để unlimited
- Onboarding Flow 4 bước cho người dùng mới (bao gồm chọn AI Provider)
- Dark / Light / System theme

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Framework** | React 18 + Vite 6 |
| **Editor** | TipTap 3 (ProseMirror-based), 12+ extensions |
| **AI Providers** | Groq API, Google Gemini API, Ollama (local) |
| **Markdown** | marked (render AI output) |
| **Auth** | Firebase Authentication (Email/Password + Google OAuth) |
| **Database** | Cloud Firestore (user settings) + IndexedDB via `idb` (documents) |
| **i18n** | react-i18next + i18next |
| **Export** | html2pdf.js (PDF), custom Markdown/HTML converter |
| **Icons** | Lucide React |
| **Deploy** | Vercel (CI/CD từ GitHub main branch) |

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js v18+
- Firebase project (Auth + Firestore)
- API Key từ ít nhất 1 provider: [Groq Console](https://console.groq.com/keys) hoặc [Google AI Studio](https://aistudio.google.com/apikey) hoặc [Ollama](https://ollama.com/download)

### Các bước

```bash
# 1. Clone
git clone https://github.com/hoangnguyen74/INT3509_3_Nhom7_AI_Writing_Assistant.git
cd INT3509_3_Nhom7_AI_Writing_Assistant

# 2. Install
npm install

# 3. Tạo file .env
cp .env.example .env   # hoặc tạo thủ công
```

**Nội dung `.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
# 4. Chạy dev server
npm run dev

# 5. Build production
npm run build
```

### Sử dụng Ollama (local AI)
```bash
# Cài Ollama: https://ollama.com/download
ollama pull llama3
ollama serve

# Nếu chạy app từ domain khác localhost (ví dụ Vercel):
OLLAMA_ORIGINS=* ollama serve
```

---

## 🏗️ Cấu trúc thư mục

```text
src/
├── components/
│   ├── AIPanel/           # AI Chat, Compose, Translate (side panel)
│   ├── Editor/            # TipTap Editor, Toolbar, AIToolbar, InlineAIMenu
│   │   ├── extensions/    # Custom TipTap extensions (GrammarHighlight)
│   │   ├── GrammarTooltip.jsx
│   │   ├── GrammarPanel.jsx
│   │   └── DiffSuggestion.jsx
│   ├── Settings/          # SettingsModal (multi-provider config)
│   ├── Sidebar/           # Document list, search, favorites, trash
│   ├── Onboarding/        # 4-step onboarding with provider selector
│   ├── Paywall/           # Upgrade modal (freemium)
│   ├── TemplateGallery/   # Document templates
│   ├── LanguageSwitcher/  # EN/VI toggle
│   └── common/            # Shared components (MarkdownContent)
├── contexts/
│   └── AppContext.jsx     # Global state (useReducer + Context)
├── hooks/
│   └── useGrammarCheck.js # Grammar check orchestration hook
├── i18n/
│   ├── index.js           # i18next config
│   └── locales/           # en.json, vi.json
├── pages/
│   └── AuthPage.jsx       # Login / Register
├── services/
│   ├── ai.js              # AI Facade — routing, settings, cleanAIOutput
│   ├── providers/
│   │   ├── models.js      # Provider config (models, URLs, API keys)
│   │   ├── groq.js        # Groq provider
│   │   ├── gemini.js      # Google Gemini/Gemma provider
│   │   ├── ollama.js      # Ollama local provider
│   │   └── openai-compat.js  # Shared SSE streaming logic
│   ├── auth.js            # Firebase Auth
│   ├── storage.js         # IndexedDB document storage
│   └── export.js          # PDF, Markdown, HTML, Text export
├── App.jsx                # Main app (Dashboard + Editor + Sidebar)
└── main.jsx               # Entry point
```

---

## 📐 Kiến trúc

```text
┌─────────────────────────────────────────────────┐
│                   React 18 SPA                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Editor   │  │ AI Panel │  │   Sidebar     │ │
│  │ (TipTap)  │  │ Chat     │  │ Documents     │ │
│  │ Toolbar   │  │ Compose  │  │ Search/Favs   │ │
│  │ Grammar   │  │ Translate│  │ Trash         │ │
│  └────┬──────┘  └────┬─────┘  └───────┬───────┘ │
│       │              │                │         │
│  ┌────┴──────────────┴────────────────┴───────┐ │
│  │         AppContext (useReducer)             │ │
│  └────┬──────────────┬────────────────┬───────┘ │
│       │              │                │         │
│  ┌────┴────┐   ┌─────┴─────┐   ┌─────┴───────┐ │
│  │ storage │   │   ai.js   │   │    auth     │ │
│  │ (IDB)   │   │  Facade   │   │ (Firebase)  │ │
│  └─────────┘   └─────┬─────┘   └─────────────┘ │
└────────────────────────┼────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │   Groq   │ │  Gemini  │ │  Ollama  │
     │  Cloud   │ │  Cloud   │ │  Local   │
     └──────────┘ └──────────┘ └──────────┘
```

- **SPA** (Single-Page Application) — Client-Side Rendering
- **Facade Pattern** — `ai.js` route request tới đúng provider
- **Local-first** — Documents lưu IndexedDB, settings sync Firestore
- **SSE Streaming** — AI response hiện real-time từng token

---

## 👥 Nhóm phát triển

**Nhóm 7** — INT3509_3, UET - VNU

---

## 📜 License

Dự án phục vụ mục đích học tập.
