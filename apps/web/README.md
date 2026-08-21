# HN LMS UI Preview

Prototype để duyệt màu, typography, component và bố cục trước khi triển khai nghiệp vụ.

## Stack

- Next.js App Router
- TypeScript strict
- Mantine
- Lucide React
- Mock data, không cần backend

## Routes

- `/`: public landing page
- `/admin`: branch dashboard
- `/admin/leads`: admissions pipeline
- `/platform`: license control plane
- `/ui-preview`: component and color gallery

Mặc định là tiếng Việt và dark theme. Header LMS hỗ trợ đổi Việt/Anh và dark/light/system.

## Run

```powershell
npm install
npm run dev
```

Mở `http://localhost:3100/ui-preview` để duyệt component trước, sau đó xem các route còn lại.
