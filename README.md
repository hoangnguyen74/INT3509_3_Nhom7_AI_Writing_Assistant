# ✍️ WriteAI

**WriteAI** là một không gian làm việc thông minh, hiện đại và giàu tính năng được sức mạnh của Trí tuệ Nhân tạo (AI) hậu thuẫn. Nền tảng này kết hợp sự linh hoạt của một trình soạn thảo văn bản (Rich Text Editor) với khả năng xử lý ngôn ngữ vượt trội của các mô hình LLM tiên tiến (Groq / LLaMA-3), được thiết kế chuyên biệt để giúp bạn viết lách tốt hơn, nhanh hơn và thông minh hơn.

## ✨ Các tính năng nổi bật

### 📝 Trình soạn thảo Cốt lõi (Core Editor)
- **Định dạng Văn bản Nâng cao**: Xây dựng dựa trên nền tảng TipTap, hỗ trợ in đậm, in nghiêng, highlight, và cấu trúc tiêu đề (Heading) đầy đủ.
- **Khối chức năng đa dạng (Advanced Blocks)**: Hỗ trợ tạo bảng (Tables), trích dẫn (Blockquotes), chèn mã nguồn (Code blocks), danh sách công việc (Checklists) và chèn ảnh nội tuyến tiện lợi.
- **Chèn Liên kết Hiện đại**: Giao diện chèn link dạng popup tương tự Slack (phím tắt `Ctrl+K` hoặc dùng Toolbar) cho phép tuỳ chỉnh chữ hiển thị.
- **Tìm kiếm & Thay thế (Find & Replace)**: Panel tìm kiếm chuyên dụng tích hợp sẵn (`Ctrl+F` / `Ctrl+H`), hoạt động mượt mà kết hợp với điều hướng luân chuyển bằng bàn phím.
- **Lưu tự động (Auto-Save)**: Tài liệu của bạn luôn được an toàn nhờ cơ chế đồng bộ theo thời gian thực xuống IndexedDB (cục bộ) và Firebase (đám mây).

### 🤖 Bộ công cụ Trợ lý AI (AI Writing Suite)
Được tiếp sức bởi tốc độ suy luận siêu tốc của Groq API:
- **Soạn thảo Thông minh (Smart Compose)**: Chỉ với một cú nhấp chuột, AI sẽ giúp bạn lên ý tưởng, lập dàn ý, mở rộng, việt hoá, rút gọn hoặc tự động sửa lỗi ngữ pháp.
- **Dịch thuật Thần tốc (Magic Translate)**: Dịch thuật tức thời hỗ trợ hơn 15+ ngôn ngữ.
- **Điều chỉnh Giọng văn (Tone Adjustment)**: Chuyển đổi linh hoạt văn phong của bạn (Chuyên nghiệp, Gần gũi, Tự tin, Mộc mạc).
- **Chuyên gia Định danh (Expert Personas)**: Đóng vai và viết lại nội dung góc nhìn của một Giám đốc Công nghệ (Tech Lead), Chuyên gia Marketing, hoặc Nhà nghiên cứu Học thuật.
- **Hỗ trợ Nội tuyến (Contextual Inline AI)**: Bôi đen một đoạn text bất kỳ và thanh công cụ AI bay (Floating menu) sẽ hiện ra để bạn lập tức ra lệnh tinh chỉnh cấu trúc câu đó.

### 🗂️ Quản lý Tài liệu
- **Bảng điều khiển (Dashboard)**: Quản lý khoa học tiến độ công việc với các thư mục Tài liệu gần đây, Yêu thích (Favorites) và Thùng rác (Trash).
- **Thư viện Mẫu (Template Gallery)**: Bắt đầu viết lách nhanh chóng với các định dạng dựng sẵn (Bài đăng Blog, Biên bản Cuộc họp, Thông cáo Báo chí, Mô tả Công việc, v.v.).
- **Xuất file Đa định dạng (Multi-Format Export)**: Đóng gói tác phẩm của bạn hoàn hảo sang định dạng **PDF (giữ nguyên tỷ lệ và font)**, **Markdown (.md)**, **HTML**, và **Text thuần**.

### 💼 Sẵn sàng cho mô hình SaaS & Thương mại hoá
- **Giới hạn & Tường phí (Paywall & Quotas)**: Hệ thống mô phỏng việc thương mại hoá. Người dùng Gói Miễn phí nhận được giới hạn hàng ngày (10 lượt gọi AI), cùng hệ thống Popup kêu gọi nâng cấp "Pro" xịn xò.
- **Thiết lập Cá nhân (User Settings)**: Hỗ trợ nhập API Key cá nhân (Bring Your Own Key) để vượt giới hạn, và tuỳ chỉnh giao diện sáng/tối.
- **Trải nghiệm Giới thiệu (Onboarding Flow)**: Cửa sổ Popup gồm các bước hướng dẫn cực đẹp mắt dành cho người dùng lần đầu đăng nhập.

### 🎨 Tinh chỉnh UI/UX
- **Giao diện Tối/Sáng (Dark/Light Mode)**: 100% tuỳ biến thông qua hệ thống biến số CSS (CSS-variable tokens).
- **Thiết kế Thích ứng (Responsive)**: Tối ưu hoá hiển thị cho di động với thanh công cụ Sidebar và AI Panels dạng Overlay.
- **Skeleton & Toasts**: Hiệu ứng chờ "tải khung" sang trọng và hệ thống thông báo trạng thái thao tác đẹp mắt.
- **Bảo mật Lỗi (Error Boundaries)**: Đảm bảo nền tảng không bao giờ bị trắng trang (crash) hoàn toàn với cơ chế bắt lỗi an toàn.

---

## 🛠️ Trụ cột Công nghệ (Tech Stack)

- **Framework**: React 18 / Vite
- **Trình soạn thảo (Editor)**: TipTap 
- **Backend & Xác thực**: Firebase (Authentication, Firestore)
- **Lưu trữ Cục bộ**: IndexedDB (thông qua `idb` wrapper cho chức năng lưu Offline)
- **Mô hình AI (LLM)**: Groq API (`llama-3.3-70b-versatile`)
- **Xuất PDF**: `html2pdf.js`
- **Bộ Icon**: Lucide React

---

## 🚀 Hướng dẫn Cài đặt

### Yêu cầu hệ thống
- Node.js (v18+)
- Tài khoản Firebase (Dùng để lấy API thiết lập Database & Auth)
- Groq API Key (Nếu bạn không thiết lập fallback key trong code)

### Các bước Cài đặt

1. **Clone repository về máy**
   ```bash
   git clone https://github.com/hoangnguyen74/INT3509_3_Nhom7_AI_Writing_Assistant.git
   cd INT3509_3_Nhom7_AI_Writing_Assistant
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**
   ```bash
   npm install
   ```

3. **Thiết lập Môi trường (.env)**
   Hãy tạo một file tên là `.env` ở thư mục gốc của dự án và điền thông tin Firebase của bạn vào:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Không bắt buộc: Key AI mặc định dành cho những users không sử dụng Key cá nhân (BYOK)
   VITE_GROQ_API_KEY=your_groq_key
   ```

4. **Khởi chạy Môi trường Phát triển (Development Server)**
   ```bash
   npm run dev
   ```

5. **Đóng gói Sản phẩm (Build for Production)**
   ```bash
   npm run build
   ```

---

## 🏗️ Cấu trúc Thư mục

```text
src/
├── components/          # Chứa các mảnh UI tái sử dụng
│   ├── AIPanel/         # Sidebar Trợ lý ảo AI (Chat, Translate...)
│   ├── Editor/          # Trình soạn thảo TipTap, Toolbar, Find&Replace
│   ├── Sidebar/         # Thanh điều hướng, Danh sách văn bản
│   ├── Paywall/         # Popup thông báo Nâng cấp
│   ├── Onboarding/      # Màn hình Giới thiệu tính năng
│   └── TemplateGallery/ # Giao diện Thư viện Mẫu
├── contexts/            # Quản lý Trạng thái Toàn cục (AppContext)
├── pages/               # Tầng Routing mức trên cùng (Ví dụ: AuthPage)
├── services/            # Các hàm gọi API & Database
│   ├── groq.js          # Chứa Prompt và Logic kết nối AI
│   ├── export.js        # Logic xuất file (Markdown, HTML, PDF)
│   ├── storage.js       # Quản lý lưu trữ Offline qua IndexedDB
│   └── auth.js          # Logic xác thực Firebase Auth
├── App.jsx              # Tệp chạy chính (Kết nối Dashboard/Editor/Sidebar)
├── main.jsx             # Điểm entry của React DOM + Lớp màng lọc lỗi
└── base.css...          # Khai báo các thiết lập và biến số CSS
```

---

## 📜 Giới thiệu Bối cảnh Lưu trữ
Dự án này được lên ý tưởng và hoàn thiện nhằm phục vụ cho học phần **INT3509_3 (Môn học: AI Writing Assistant)**. Đóng vai trò là một nguyên mẫu chất lượng cao (high-fidelity prototype), dự án chứng minh thành công việc tích hợp kiến trúc ứng dụng React web hiện đại với những phương pháp Prompt-Engineering trực tiếp trong việc kết nối với trí tuệ nhân tạo.
