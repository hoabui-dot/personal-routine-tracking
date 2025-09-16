Bạn là một chuyên gia phát triển hệ thống **personal routine tracker** theo kiến trúc **microservice**, đồng thời là một **senior software engineer** có kinh nghiệm với:

- TypeScript
- Next.js
- Node.js (Express hoặc Fastify)
- PostgreSQL (SQL query trực tiếp)
- Docker Compose
- ESLint & Prettier

Yêu cầu tạo một ứng dụng full flow trên một repository trống, gồm **web-frontend** và **api-service**, với các đặc tả sau:

1. Cấu trúc & Khởi tạo
   - Tạo hai thư mục `web-frontend/` và `api-service/` dưới gốc repo.
   - Thiết lập `tsconfig.json`, `.eslintrc.js`, `.prettierrc` cho cả hai service.
   - Cấu hình `Dockerfile` tương ứng cho frontend và backend.

2. Docker Compose
   - Viết file `docker-compose.yml` để khởi động ba container:
     - `db`: PostgreSQL với biến môi trường `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
     - `backend`: build từ `api-service/`, port 4000, kết nối tới `db`.
     - `frontend`: build từ `web-frontend/`, port 3000, kết nối tới `backend`.

3. API-Service (`api-service/`)
   - Sử dụng Node.js + TypeScript + Express (hoặc Fastify).
   - File kết nối PostgreSQL (`db.ts`) với Pool và hàm `query(sql, params)`.
   - SQL schema khởi tạo các bảng:
     - `goals(id, title, year, created_at)`
     - `sub_goals(id, goal_id, title, hours_expected, start_month, end_month)`
     - `sessions(id, sub_goal_id, started_at, ended_at, hours_spent GENERATED)`
   - CRUD endpoints:
     - POST/GET/PUT/DELETE `/goals`
     - POST/GET `/sub-goals`
     - POST `/sessions` (start/stop session)
     - GET `/reports?mode={day|week|month|year}`

4. Web-Frontend (`web-frontend/`)
   - Next.js + TypeScript.
   - Kết nối API qua `fetch` hoặc `axios`.
   - Trang chính (`pages/index.tsx`):
     - Form tạo “Goal năm”.
     - Danh sách goals hiện có.
     - Với mỗi goal: link vào trang chi tiết.
   - Trang chi tiết goal (`pages/goals/[id].tsx`):
     - Form thêm sub-goal (tiêu đề, giờ dự kiến, tháng bắt đầu/kết thúc).
     - Hiển thị lịch tháng/tuần/ngày tự động phân bổ dựa trên range của sub-goal.
     - Với mỗi ngày: nút “Start/Stop” session, hiển thị trạng thái hoàn thành khi đủ giờ.
   - Trang báo cáo (`pages/report.tsx`):
     - Biểu đồ (Chart.js/Recharts) hiển thị tiến độ theo `mode` (day/week/month/year).
     - Thanh chuyển đổi mode.
     - Dữ liệu biểu đồ lấy từ endpoint `/reports`.

5. Tính năng & UX
   - Tự động phân bổ sub-goal thành các mục tháng → tuần → ngày.
   - Ghi nhận timestamp khi “Start”/“Stop” session, tính giờ tự động, lưu vào DB.
   - Tích hợp ESLint + Prettier để lint & format code.
   - Thông báo (alerts hoặc toast) nhắc nhở deadline tuần/tháng.
   - UI responsive, thân thiện với người dùng.

6. Hướng dẫn khởi động
   - Chạy `docker-compose up --build`.
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000
   - DB: localhost:5432
