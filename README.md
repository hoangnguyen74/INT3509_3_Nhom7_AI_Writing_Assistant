# ✍️ WriteAI

**WriteAI** is an intelligent, modern, and feature-rich writing workspace powered by Artificial Intelligence. It combines the flexibility of a rich text editor with the sheer power of advanced LLMs (Groq / LLaMA-3), designed to help you write better, faster, and smarter.

## ✨ Features

### 📝 Core Editor
- **Rich Text Formatting**: Built on top of TipTap, supporting bold, italics, highlights, and custom heading hierarchies.
- **Advanced Blocks**: Native support for tables, blockquotes, code blocks, checklists, and inline images.
- **Custom Link Handling**: Slack-like link insertion (`Ctrl+K` / Toolbar) with display text formatting.
- **Find & Replace**: Built-in specialized search panel (`Ctrl+F` / `Ctrl+H`) working seamlessly with keyboard navigation.
- **Auto-Save**: Documents are synced automatically to local IndexedDB and Firebase.

### 🤖 AI Writing Suite
Powered by the ultra-fast Groq API, featuring:
- **Smart Compose**: Brainstorm, outline, expand, shorten, or fix grammar with one click.
- **Magic Translate**: Instant translation across 15+ languages.
- **Tone Adjustment**: Shift your writing tone (Professional, Casual, Confident, Friendly).
- **Expert Personas**: Rewrite content through the lens of a Tech Lead, Marketing Expert, or Academic Researcher.
- **Contextual Inline AI**: Highlight text and interact with the floating AI menu to modify specific sentences.

### 🗂️ Document Management
- **Dashboard**: A structured dashboard to organize recent work, favorites, and trash.
- **Template Gallery**: Start quick with predefined layouts (Blog Post, Meeting Notes, Press Release, Job Descriptions, etc).
- **Multi-Format Export**: Export your masterpiece flawlessly to **PDF (preserves styling)**, **Markdown (.md)**, **HTML**, and **Plain Text**.

### 💼 SaaS / Monetization Ready
- **Paywall & Quotas**: Simulated monetization system. Free users get a daily quota (10 AI actions), seamlessly promoting a "Pro" tier upgrade via a slick interactive modal.
- **User Settings**: Dedicated pane for self-hosting (BYOK - Bring Your Own Key) and customizing theme preferences.
- **Onboarding Flow**: Beautiful step-by-step introduction modal for first-time users.

### 🎨 UI/UX Polish
- **Dark/Light Mode**: Full CSS-variable based theme toggling.
- **Responsive Design**: Mobile-friendly sidebar and floating AI panels.
- **Loading Skeletons & Toasts**: Premium feedback loops for long-running operations.
- **Error Boundaries**: Fail-safe mechanisms preventing pure white screens on crash.

---

## 🛠️ Technology Stack

- **Framework**: React 18 / Vite
- **Editor Engine**: TipTap 
- **Backend & Auth**: Firebase (Authentication, Firestore)
- **Local Storage**: IndexedDB (via `idb` wrapper for large offline document cache)
- **AI Provider**: Groq API (`llama-3.3-70b-versatile`)
- **PDF Generation**: `html2pdf.js`
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Account (for Database & Auth setup)
- Groq API Key (If no global fallback key is provided)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hoangnguyen74/INT3509_3_Nhom7_AI_Writing_Assistant.git
   cd INT3509_3_Nhom7_AI_Writing_Assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Optional: Global AI Key if you want users to bypass BYOK
   VITE_GROQ_API_KEY=your_groq_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🏗️ Project Structure

\`\`\`text
src/
├── components/          # Reusable UI parts
│   ├── AIPanel/         # Chat, Compose, Translate AI tabs
│   ├── Editor/          # TipTap core, Toolbar, Find&Replace
│   ├── Sidebar/         # App navigation, document list
│   ├── Paywall/         # Monetization modals
│   ├── Onboarding/      # Welcome flow
│   └── TemplateGallery/ # Pre-built content layouts
├── contexts/            # Global State Management (AppContext)
├── pages/               # Top-level Routing (AuthPage, etc)
├── services/            # API & DB utilities
│   ├── groq.js          # AI Prompts & Call logic
│   ├── export.js        # Markdown, HTML, PDF handlers
│   ├── storage.js       # IndexedDB offline logic
│   └── auth.js          # Firebase Auth logic
├── App.jsx              # Main App entry (Dashboard/Editor router)
├── main.jsx             # React DOM bindings + ErrorBoundary
└── base.css...          # CSS Tokens & Styling
\`\`\`

---

## 📜 License & Academic Context
This project was initially shaped and completed for the **INT3509_3 (AI Writing Assistant)** academic course module. Functioning as a high-fidelity prototype, it successfully demonstrates integration of modern React architectures side-by-side with raw AI prompt-engineering methodologies.
