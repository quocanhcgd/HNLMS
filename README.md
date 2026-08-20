# HN LMS

LMS đa ngành, đa chi nhánh với public landing, tuyển sinh, học tập, assessment, multimedia learning, HRM, payroll, finance, reporting và AI governance.

## Current state

Repository hiện đang ở giai đoạn UI prototype và specification-first. Xem [specification index](./specs/001-lms-multi-branch/) và [full-stack readiness checklist](./specs/001-lms-multi-branch/checklists/full-stack-readiness.md).

Prototype web hiện chạy với Next.js App Router, Mantine, TanStack Table 8.x và mock data:

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000/ui-preview` hoặc route `/admin`, `/admin/leads`, `/platform`.

## Repository rules

- Không commit `.env`, credentials, private keys, media upload, build output hoặc `node_modules`.
- Mọi thay đổi nghiệp vụ phải cập nhật spec/contract/task hoặc nêu rõ lý do không cần.
- Không đánh dấu task `[X]` nếu artifact/test thực tế chưa tồn tại.
- Full-stack production readiness phải qua checklist trong `specs/001-lms-multi-branch/checklists/full-stack-readiness.md`.

## Planned runtime

- Web: Next.js App Router + TypeScript + Mantine + TanStack Table.
- API: NestJS modular monolith.
- Worker: Node.js/TypeScript.
- Data: PostgreSQL, Redis, private S3-compatible storage.
- Media: TipTap, Zod, Uppy, Vidstack, WaveSurfer.js, PDF.js, FFmpeg, Sharp, LibreOffice.
- Deployment: Debian/Ubuntu, Nginx, systemd, versioned artifacts; no Docker in production baseline.
