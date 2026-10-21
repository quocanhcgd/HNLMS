# Full-Stack Readiness Checklist

**Purpose**: Gate triển khai và vận hành, khác với checklist chất lượng yêu cầu. `[x]` chỉ được đánh dấu khi artifact hoặc test tương ứng tồn tại.

## Critical Before Implementation

- [x] Một package manager, Node version và lockfile policy duy nhất
- [x] Web, API, worker và shared packages có workspace/build boundary rõ
- [x] Environment schema fail-fast và `.env.example` không chứa secret
- [x] PostgreSQL migration/data-access/transaction/decimal/timezone ADR đã chốt
- [x] Authentication/session/CSRF/CORS/rate-limit ADR đã chốt
- [x] Tenant resolver, connection pool và database-per-tenant isolation test đã định nghĩa
- [x] Authorization matrix và module/license backend guard có negative tests
- [x] OpenAPI/versioning/error/idempotency conventions đã chốt
- [x] Deterministic seed data cho hai tenant và mọi persona
- [x] CI chạy install, lint, typecheck, test, migration và build
- [x] CI chạy install, lint, typecheck, unit test, Playwright E2E và release artifact checksum

## Critical Before Production Data

- [ ] Secret manager, rotation và signing/encryption key ownership đã chốt
- [ ] Backup encryption, restore drill, RPO/RTO và offsite policy đạt
- [ ] Privacy/consent/retention/legal hold/export/delete/anonymize matrix được duyệt
- [ ] Audit redaction và sensitive logging policy được kiểm thử
- [ ] Malware scanning/quarantine và private media signed URL test đạt
- [ ] Payment/meeting/ERP/AI/video providers có sandbox, contract và reconciliation test
- [ ] Email/SMS template localization, opt-out và delivery retry được kiểm thử
- [ ] Monitoring, alerting, correlation ID, queue backlog và dead-letter runbook hoạt động
- [ ] Native Debian/Ubuntu install, health check, migration, rollback và restore rehearsal đạt

## Product Release Gates

- [x] UI foundation vi/en, dark/light/system, keyboard, mobile và deep-link đạt
- [ ] Cross-tenant/branch/student/parent negative access đạt 100%
- [ ] Enrollment/payment/payroll idempotency và locked-history invariants đạt
- [ ] Lesson schema/media processing/playback/speaking gate T160 đạt nếu release có multimedia
- [ ] Performance dataset và SLO test đạt theo SC-020 và multimedia limits
- [ ] Dependency vulnerability, license compliance và secret scan không còn Critical/High chưa có exception được duyệt
- [ ] Provider outage/manual fallback và disaster recovery được diễn tập
- [ ] Release notes, version, migration compatibility và rollback decision owner đã xác nhận

## Current Audit 2026-08-20

- [x] UI prototype build/typecheck và TanStack Table route hoạt động
- [x] Spec, plan, contracts, data model và multimedia phase đã có
- [x] UI foundation acceptance gate T009/T012-T022 đã có evidence trong quickstart
- [x] Backend, worker, shared packages, database và integrations đã được khởi tạo ở mức foundational
- [x] CI, infra, tests và production runbooks đã có; production rehearsal vẫn là gate riêng
- [x] Provider, authentication, payroll/legal formulas và privacy policy đã có decision record/policy; sandbox và vận hành production vẫn là gate riêng

**Readiness status**: Implementation gate đạt; production gate vẫn chặn cho đến khi hoàn tất bằng chứng vận hành, diễn tập khôi phục, provider reconciliation, monitoring và phê duyệt risk exception nếu cần.
