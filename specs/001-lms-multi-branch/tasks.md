---
description: "Task list for LMS đa ngành đa chi nhánh"
---

# Tasks: LMS đa ngành đa chi nhánh

**Input**: Design documents from `specs/001-lms-multi-branch/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Stack**: TypeScript, Node.js LTS, Next.js App Router, Mantine, TanStack Table 8.x, next-intl, TipTap, Zod, Uppy, Vidstack, WaveSurfer.js, PDF.js/react-pdf, NestJS, PostgreSQL, Redis, private object storage, Nginx, systemd, Vitest, Playwright.

**Testing**: Bao gồm unit, authorization, integration, contract, E2E, performance, resilience và native deployment tests vì spec/constitution yêu cầu các quality gates này.

## Phase 1: Setup

**Purpose**: Khởi tạo monorepo, toolchain và native Linux release structure.

- [x] T001 Tạo cấu trúc monorepo `apps/web`, `apps/api`, `worker`, `packages`, `infra` theo [plan.md](./plan.md)
- [x] T002 [P] Khởi tạo npm workspace TypeScript/Node.js LTS và lockfile trong `package.json`, `package-lock.json` và workspace config
- [x] T003 [P] Khởi tạo Next.js app trong `apps/web/` với TypeScript và App Router
- [x] T004 [P] Khởi tạo NestJS app trong `apps/api/` với module loader
- [x] T005 [P] Khởi tạo worker app trong `worker/` với queue consumer entrypoint
- [x] T006 [P] Cấu hình ESLint, Prettier, TypeScript strict và scripts kiểm tra trong `package.json`, `eslint.config.mjs`, `tsconfig.json`
- [x] T007 [P] Cấu hình Vitest và Playwright trong `vitest.config.ts` và `playwright.config.ts`
- [x] T008 [P] Tạo shared packages `packages/domain-contracts`, `packages/authorization`, `packages/module-sdk`, `packages/license-contracts`, `packages/ui`, `packages/theme-presets`; `packages/ui` giữ shared UI contracts/theme helpers; không sao chép source Mantine
- [x] T009 [P] Hoàn thiện Mantine provider, color-scheme bootstrap, CSS Modules/Mantine styles, semantic theme override, TanStack Table 8.x và next-intl trong `apps/web/`; prototype đã có Mantine/TanStack nhưng chưa có next-intl/theme package hoàn chỉnh
- [x] T010 [P] Tạo native deployment skeleton gồm `infra/systemd/`, `infra/nginx/`, `infra/release-scripts/`, `infra/environments/` và `infra/secrets/README.md`
- [x] T011 [P] Tạo CI checks cho lint, typecheck, unit test, build artifact và checksum trong `.github/workflows/ci.yml`

## Phase 2: UI Foundation and Application Shell

**Purpose**: Chốt Next.js App Router, Mantine component contract, theme và ba không gian giao diện trước mọi màn hình nghiệp vụ.

- [x] T012 Tạo route groups và nested layouts cho `(public)`, `(platform)` và LMS application trong `apps/web/src/app/`; dùng duy nhất Next.js App Router, `next/link` và `next/navigation`, không dùng React Router
- [x] T013 [P] Thiết lập Server Component mặc định, Client Component boundary, `loading.tsx`, `error.tsx`, `not-found.tsx`, metadata và deep-link behavior cho các route nền tảng trong `apps/web/src/app/`
- [x] T014 [P] Tạo wrapper/composition dùng chung quanh Mantine cho button, input, textarea, select, checkbox, modal, drawer, menu, tabs, table, tooltip, notification và sidebar trong `apps/web/src/components/ui/`
- [x] T015 Tạo semantic token contract cho light/dark/system, typography, spacing, radius, border, elevation, focus và trạng thái trong `apps/web/src/app/styles.css` cùng `apps/web/src/lib/theme/`
- [x] T016 Tạo public shell không dùng admin navigation trong `apps/web/src/app/(public)/layout.tsx` và các component liên quan trong `apps/web/src/components/shell/`
- [x] T017 Tạo license control plane shell với navigation riêng trong `apps/web/src/app/(platform)/platform/layout.tsx` và `apps/web/src/components/shell/`
- [x] T018 Tạo LMS application shell gồm workspace switcher, grouped navigation, nested submenu, active state, header, footer, collapsed desktop sidebar và mobile sheet trong `apps/web/src/app/admin/layout.tsx` và `apps/web/src/components/shell/`
- [x] T019 [P] Tạo typed navigation manifests, active-route resolver, locale labels và entitlement-aware visibility theo từng product boundary trong `apps/web/src/lib/navigation/` và `apps/web/src/lib/i18n/`
- [x] T020 [P] Chuẩn hóa page frame, toolbar, form field, data table, pagination, loading, empty, error, forbidden và confirmation compositions trong `apps/web/src/components/domain/`
- [x] T021 [P] Đồng bộ theme preset preview với application shell thật, kiểm tra contrast, persistence, publish/rollback và light/dark/system trong `apps/web/src/app/admin/settings/` và `apps/web/src/lib/theme/`
- [x] T022 [P] Viết Playwright visual, responsive, keyboard, accessibility, theme persistence và routing/deep-link tests cho UI foundation trong `apps/web/tests/visual/`, `apps/web/tests/accessibility/` và `apps/web/tests/e2e/`
- [x] T023 Xác nhận UI foundation acceptance gate trên desktop/mobile trước khi mở rộng màn hình nghiệp vụ; ghi kết quả vào `specs/001-lms-multi-branch/quickstart.md`

**Checkpoint**: Không triển khai thêm portal hoặc màn hình nghiệp vụ khi T009 và T012-T023 chưa hoàn tất.

## Phase 3: Foundational Backend

**Purpose**: Hạ tầng backend bắt buộc chặn tất cả user stories.

- [x] T024 Tạo migration framework, database connection, tenant database resolver và migration runner trong `apps/api/src/database/` và `infra/migrations/`
- [x] T025 Tạo shared PostgreSQL entities cho `Organization`, `TenantInstance`, `User`, `Role`, `Permission`, `ScopeGrant` và `AuditEvent` trong `apps/api/src/modules/identity-access/`
- [x] T026 Tạo authorization context middleware và scope guards cho organization, branch, class, student delegation trong `packages/authorization/` và `apps/api/src/shared/authz/`
- [x] T027 Tạo authentication/session flow, password policy, account status và super-admin boundary trong `apps/api/src/modules/identity-access/`
- [x] T028 Tạo audit event service append-only và correlation ID middleware trong `apps/api/src/shared/audit/` và `apps/api/src/shared/observability/`
- [x] T029 Tạo module manifest schema, dependency resolver, module registry và effective module state trong `packages/module-sdk/` và `apps/api/src/modules/module-registry/`
- [x] T030 Tạo signed license document schema, verifier, cache, grace/expiry policy và quota evaluator trong `packages/license-contracts/` và `apps/api/src/modules/license-runtime/`
- [x] T031 Tạo super-admin product plan, license issue/renew/revoke và license audit foundation trong `apps/api/src/modules/super-admin-license/`
- [x] T032 Tạo global module/license guards cho backend routes, jobs và frontend navigation trong `apps/api/src/shared/module-guard/`, `apps/web/src/lib/navigation/` và `worker/src/shared/`
- [x] T033 Tạo PostgreSQL outbox/inbox, idempotency key, retry policy và dead-letter primitives trong `apps/api/src/shared/integrations/` và `worker/src/shared/`
- [x] T034 Tạo Redis queue/cache/lock adapters và worker scheduling trong `worker/src/shared/queue/` và `apps/api/src/shared/cache/`
- [x] T035 Tạo private object storage adapter, signed URL authorization và file metadata primitives trong `apps/api/src/shared/storage/`
- [x] T036 Tạo API error format, validation pipe, pagination, export job contract và OpenAPI generation trong `apps/api/src/shared/http/`
- [x] T037 Tạo structured logging, metrics, health checks và systemd/Nginx deployment health endpoints trong `apps/api/src/shared/observability/`, `infra/systemd/`, `infra/nginx/`
- [x] T038 [P] Tạo foundational unit tests cho authz, module dependency, license signature, idempotency và tenant resolver trong `apps/api/tests/unit/` và `packages/*/tests/`
- [x] T039 [P] Tạo authorization negative-access matrix tests trong `apps/api/tests/authorization/scope-matrix.spec.ts`
- [x] T040 [P] Tạo database-per-tenant provisioning, backup metadata và connection isolation tests trong `apps/api/tests/integration/tenant-isolation.spec.ts`

**Checkpoint**: Foundation ready; user stories có thể triển khai độc lập sau Phase 3.

## Phase 4: User Story 1 - Quản trị tổ chức, cài đặt và phân quyền (P1) 🎯 MVP

**Goal**: Quản lý tổ chức, chi nhánh, vai trò, scope, cài đặt chung và theme theo tổ chức.

**Independent Test**: Tạo hai chi nhánh, phân quyền khác nhau, đổi theme một tổ chức và xác minh dữ liệu/API/theme không rò sang tổ chức khác.

- [x] T041 [P] [US1] Tạo `Branch`, `OrganizationSetting` và `BrandTheme` migrations/entities trong `apps/api/src/modules/organization-branch/`
- [x] T042 [US1] Implement branch CRUD, status lifecycle và branch scope trong `apps/api/src/modules/organization-branch/branch.service.ts`
- [x] T043 [US1] Implement role/permission assignment và scope grant UI/API trong `apps/api/src/modules/identity-access/` và `apps/web/src/app/admin/access/`
- [x] T044 [US1] Implement common settings và Mantine theme preview/publish/rollback trong `apps/api/src/modules/organization-branch/` và `apps/web/src/app/admin/settings/`
- [x] T045 [US1] Implement organization module enable/disable UI và effective-state explanation trong `apps/web/src/app/admin/modules/`
- [x] T046 [US1] Add US1 API contract, authorization and E2E tests in `apps/api/tests/contract/us1-organization.contract.spec.ts` and `apps/web/tests/e2e/us1-organization.spec.ts`

## Phase 5: User Story 2 - Landing page và đăng ký tư vấn (P1)

**Goal**: Public landing page có quản trị nội dung, khóa học, giáo viên, học viên tiêu biểu, tin tức, thông báo và form tư vấn.

**Independent Test**: Publish content, xem public page và gửi lead tư vấn; draft không hiển thị public.

- [x] T047 [P] [US2] Tạo `LandingContent` entity, versioning và publication migrations trong `apps/api/src/modules/marketing-admission/`
- [x] T048 [US2] Implement public landing/catalog pages bằng Mantine trong `apps/web/src/app/(public)/`
- [x] T049 [US2] Implement landing content admin CRUD, preview, publish, revoke và ordering trong `apps/web/src/app/admin/marketing/` và `apps/api/src/modules/marketing-admission/`
- [x] T050 [US2] Implement public consultation form, consent và idempotent submission trong `apps/web/src/app/(public)/consultation/` và `apps/api/src/modules/marketing-admission/`
- [x] T051 [US2] Add public SEO metadata, sitemap, empty/error/loading states trong `apps/web/src/app/(public)/`
- [x] T052 [US2] Add US2 contract and E2E tests in `apps/api/tests/contract/us2-public.contract.spec.ts` and `apps/web/tests/e2e/us2-landing.spec.ts`

## Phase 6: User Story 3 - Tư vấn tuyển sinh và ghi danh (P1)

**Goal**: Lead, phân tuyến tư vấn, lịch sử chăm sóc, thi đầu vào và chuyển đổi thành học viên/ghi danh.

**Independent Test**: Lead được phân công, làm bài đầu vào, nhận đề xuất lớp và tạo enrollment/hóa đơn đúng một lần.

- [x] T053 [P] [US3] Tạo `Lead`, `Consultation`, `LeadAssignment` migrations/entities trong `apps/api/src/modules/marketing-admission/`
- [x] T054 [US3] Implement lead routing, consultant ownership, duplicate lead detection và lifecycle trong `apps/api/src/modules/marketing-admission/`
- [x] T055 [US3] Implement consultant portal, notes, next actions và conversion flow trong `apps/web/src/app/admin/admission/`
- [x] T056 [US3] Implement entrance-assessment assignment link từ lead sang assessment trong `apps/api/src/modules/assessment-english/`
- [x] T057 [US3] Add US3 integration/contract/E2E tests trong `apps/api/tests/integration/us3-admission.spec.ts` và `apps/web/tests/e2e/us3-admission.spec.ts`

## Phase 7: User Story 4 - Chương trình, lớp học và lịch học (P1)

**Goal**: Tạo program/course/module/class, phân công giáo viên, lịch và kiểm tra xung đột.

**Independent Test**: Mở lớp tại chi nhánh, phân công giáo viên, lưu lịch không trùng và công bố tuyển sinh.

- [x] T058 [P] [US4] Tạo department, program, course, module, class, schedule entities/migrations trong `apps/api/src/modules/academic-learning/`
- [x] T059 [US4] Implement program/course/module CRUD và publication lifecycle trong `apps/api/src/modules/academic-learning/`
- [x] T060 [US4] Implement class opening, capacity, modality, branch assignment và enrollment status trong `apps/api/src/modules/academic-learning/`
- [x] T061 [US4] Implement schedule conflict engine cho teacher, room và online session trong `apps/api/src/modules/academic-learning/`
- [x] T062 [US4] Implement academic admin UI dùng Mantine trong `apps/web/src/app/admin/academic/`
- [x] T063 [US4] Add US4 contract/integration/E2E tests trong `apps/api/tests/integration/us4-academic.spec.ts` và `apps/web/tests/e2e/us4-academic.spec.ts`

## Phase 8: User Story 5 - Học liệu, bài giảng và thư viện số (P1)

**Goal**: Tạo, duyệt, version, phân quyền, tìm kiếm và sử dụng tài nguyên học tập.

**Independent Test**: Publish tài liệu theo lớp/ngành, học viên đúng quyền tìm và mở được; người ngoài quyền bị từ chối.

- [x] T064 [P] [US5] Tạo `LearningContent`, `LibraryResource`, file metadata và version migrations trong `apps/api/src/modules/academic-learning/`
- [x] T065 [US5] Implement content approval, versioning, access scope và private signed URL trong `apps/api/src/modules/academic-learning/` và `apps/api/src/shared/storage/`
- [x] T066 [US5] Implement library search/filter/category và saved resources trong `apps/api/src/modules/academic-learning/`
- [x] T067 [US5] Implement teacher content editor và student library/player UI trong `apps/web/src/app/teacher/content/` và `apps/web/src/app/student/library/`
- [x] T068 [US5] Add document processing/indexing worker trong `worker/src/jobs/content-processing/`
- [x] T069 [US5] Add US5 authorization, contract and E2E tests trong `apps/api/tests/authorization/us5-content-scope.spec.ts` và `apps/web/tests/e2e/us5-library.spec.ts`

## Phase 9: User Story 6 - Học tập, phụ huynh và trao đổi ba bên (P1)

**Goal**: Enrollment progress, parent delegation tùy chọn và conversation tổ chức/giáo viên/phụ huynh.

**Independent Test**: Cấp quyền khác nhau cho phụ huynh của hai học viên, tạo trao đổi ba bên và xác minh scope độc lập.

- [x] T070 [P] [US6] Tạo student, enrollment, parent link và delegation migrations/entities trong `apps/api/src/modules/academic-learning/` và `apps/api/src/modules/communication/`
- [x] T071 [US6] Implement enrollment, progress, attendance, score và completion state trong `apps/api/src/modules/academic-learning/`
- [x] T072 [US6] Implement parent delegation grant/revoke/expiry và scoped data resolver trong `apps/api/src/modules/communication/`
- [x] T073 [US6] Implement student/parent portals cho lịch, tiến độ, điểm, học phí và bài tập trong `apps/web/src/app/student/` và `apps/web/src/app/parent/`
- [x] T074 [US6] Implement three-party conversation, member scope, message và attachment policy trong `apps/api/src/modules/communication/` và `apps/web/src/app/parent/conversations/`
- [x] T075 [US6] Add US6 authorization matrix and E2E tests trong `apps/api/tests/authorization/us6-parent-delegation.spec.ts` và `apps/web/tests/e2e/us6-parent.spec.ts`

## Phase 10: User Story 7 - Trao đổi nội bộ và thông báo (P2)

**Goal**: Conversation theo nghiệp vụ/lớp/học viên và notification theo audience.

**Independent Test**: Gửi thông báo theo branch/class/role và xác minh delivery/read state đúng scope.

- [x] T076 [P] [US7] Tạo conversation, member, message, notification và delivery migrations trong `apps/api/src/modules/communication/`
- [x] T077 [US7] Implement conversation moderation, member lifecycle và notification audience resolver trong `apps/api/src/modules/communication/`
- [x] T078 [US7] Implement notification worker cho email/in-app channels trong `worker/src/jobs/notifications/`
- [x] T079 [US7] Implement communication center và notification inbox trong `apps/web/src/app/admin/communication/`
- [x] T080 [US7] Add US7 contract/E2E tests trong `apps/api/tests/contract/us7-communication.contract.spec.ts` và `apps/web/tests/e2e/us7-communication.spec.ts`

## Phase 11: User Story 8 - Thi đầu vào, thi thử và xếp lớp (P1)

**Goal**: Question bank, entrance/mock assessments, attempts, scoring và recommendations.

**Independent Test**: Tạo đề, làm/nộp bài, retry submit không tạo attempt trùng và kết quả được công bố theo policy.

- [x] T081 [P] [US8] Tạo assessment bank, assessment, attempt, result migrations/entities trong `apps/api/src/modules/assessment-english/`
- [x] T082 [US8] Implement question approval, blueprint, time window, attempts limit và scoring policy trong `apps/api/src/modules/assessment-english/`
- [x] T083 [US8] Implement timed attempt state machine, autosave, submit idempotency và timeout handling trong `apps/api/src/modules/assessment-english/`
- [x] T084 [US8] Implement assessment engine UI và result/recommendation UI trong `apps/web/src/app/student/assessment/` và `apps/web/src/app/teacher/assessment/`
- [x] T085 [US8] Add assessment contract, duplicate/retry and E2E tests trong `apps/api/tests/contract/us8-assessment.contract.spec.ts` và `apps/web/tests/e2e/us8-assessment.spec.ts`

## Phase 12: User Story 9 - Lộ trình Tiếng Anh (P1)

**Goal**: Placement, pathway và tiến bộ riêng cho listening, speaking, reading, writing.

**Independent Test**: Xếp level, hoàn thành hoạt động bốn kỹ năng và chờ giáo viên chấm speaking/writing.

- [x] T086 [P] [US9] Tạo English pathway, level, skill record và placement rule entities trong `apps/api/src/modules/assessment-english/`
- [x] T087 [US9] Implement four-skill placement, progress và manual review workflow trong `apps/api/src/modules/assessment-english/`
- [x] T088 [US9] Implement English learning activities và teacher review UI trong `apps/web/src/app/student/english/` và `apps/web/src/app/teacher/english/`
- [x] T089 [US9] Add skill-level calculation and E2E tests trong `apps/api/tests/integration/us9-english.spec.ts` và `apps/web/tests/e2e/us9-english.spec.ts`

## Phase 13: User Story 10 - Lớp học online (P1)

**Goal**: Online session, meeting provider, attendance và private recording.

**Independent Test**: Tạo session, join đúng quyền, nhận attendance/recording event và xử lý duplicate webhook.

- [x] T090 [P] [US10] Tạo online session, provider mapping, attendance sync và recording entities trong `apps/api/src/modules/online-class/`
- [x] T091 [US10] Implement meeting provider adapter và signed webhook inbox trong `packages/integration-adapters/` và `apps/api/src/modules/integrations/meeting/`
- [x] T092 [US10] Implement meeting sync worker, reconciliation và recording permission link trong `worker/src/jobs/meeting-sync/`
- [x] T093 [US10] Implement online session teacher/student/parent UI trong `apps/web/src/app/teacher/online/`, `apps/web/src/app/student/online/` và `apps/web/src/app/parent/online/`
- [ ] T094 [US10] Add provider contract, duplicate webhook and E2E tests trong `apps/api/tests/contract/us10-meeting.contract.spec.ts` và `apps/web/tests/e2e/us10-online.spec.ts`

## Phase 14: User Story 11 - Tài chính, thanh toán và kế toán (P1)

**Goal**: Invoice, payment, refund, reconciliation và accounting/ERP sync.

**Independent Test**: Tạo invoice, xác nhận webhook lặp, cập nhật công nợ một lần và đồng bộ ERP không trùng.

- [x] T095 [P] [US11] Tạo invoice, payment transaction, refund và accounting sync migrations/entities trong `apps/api/src/modules/billing-payment/`
- [x] T096 [US11] Implement invoice, discount, receivable, refund và receipt services trong `apps/api/src/modules/billing-payment/`
- [x] T097 [US11] Implement payment provider adapter, signed webhook, idempotency và reconciliation trong `packages/integration-adapters/` và `apps/api/src/modules/integrations/payment/`
- [x] T098 [US11] Implement accounting/ERP outbox worker, retry, duplicate prevention và reconcile trong `worker/src/jobs/accounting-sync/`
- [x] T099 [US11] Implement finance portal, invoice view, payment flow và receipt UI trong `apps/web/src/app/admin/finance/`, `apps/web/src/app/student/billing/` và `apps/web/src/app/parent/payments/`
- [x] T100 [US11] Add payment/ERP contract, duplicate/retry and E2E tests trong `apps/api/tests/contract/us11-finance.contract.spec.ts` và `apps/web/tests/e2e/us11-payment.spec.ts`

## Phase 15: User Story 12 - Nhân sự và quản lý giáo viên (P1)

**Goal**: HRM, hồ sơ, hợp đồng, tuyển dụng, chấm công, nghỉ phép, đào tạo, performance và teacher assignment.

**Independent Test**: Tạo giáo viên, phân công lớp, ghi công/nghỉ phép và hoàn thành performance review.

- [x] T101 [P] [US12] Tạo employee profile, employment contract, work schedule, attendance, leave và review entities trong `apps/api/src/modules/hrm-teacher/`
- [x] T102 [US12] Implement employee lifecycle, contract, branch assignment và certification management trong `apps/api/src/modules/hrm-teacher/`
- [x] T103 [US12] Implement attendance/shift/leave approval và balance service trong `apps/api/src/modules/hrm-teacher/`
- [x] T104 [US12] Implement teacher capability, workload, class assignment và substitute flow trong `apps/api/src/modules/hrm-teacher/`
- [x] T105 [US12] Implement HRM and teacher portals trong `apps/web/src/app/admin/hrm/` và `apps/web/src/app/teacher/`
- [x] T106 [US12] Add HRM authorization and E2E tests trong `apps/api/tests/authorization/us12-hrm.spec.ts` và `apps/web/tests/e2e/us12-hrm.spec.ts`

## Phase 16: User Story 13 - Payroll, thu chi và tài chính chi nhánh (P1)

**Goal**: Budget, branch finance, payroll đầy đủ, teaching pay, tax/insurance, lock và adjustment.

**Independent Test**: Tính payroll theo công/giờ/lớp, approve/lock, tạo adjustment và phân bổ thu chi đúng chi nhánh.

- [ ] T107 [P] [US13] Tạo budget, finance category, cash account, finance entry, expense request và receipt entities trong `apps/api/src/modules/payroll-finance/`
- [ ] T108 [P] [US13] Tạo payroll period, payroll line, payslip và calculation snapshot entities trong `apps/api/src/modules/payroll-finance/`
- [ ] T109 [US13] Implement branch budget, income/expense ledger, approval routing và document validation trong `apps/api/src/modules/payroll-finance/`
- [ ] T110 [US13] Implement payroll calculation engine theo salary/hour/class, allowance, deduction, tax, insurance và calculation version trong `apps/api/src/modules/payroll-finance/`
- [ ] T111 [US13] Implement payroll approve/lock/adjustment workflow và payslip publication trong `apps/api/src/modules/payroll-finance/`
- [ ] T112 [US13] Implement payroll/branch finance portal trong `apps/web/src/app/admin/payroll/` và `apps/web/src/app/admin/finance/branch-finance/`
- [x] T113 [US13] Add payroll invariant, lock bypass, multi-branch allocation and E2E tests trong `apps/api/tests/integration/us13-payroll.spec.ts` và `apps/web/tests/e2e/us13-payroll.spec.ts`

## Phase 17: User Story 14 - AI hỗ trợ và tự động hóa có kiểm soát (P1)

**Goal**: AI Gateway, policy, prompt/model version, source, confidence, review, appeal và manual fallback.

**Independent Test**: AI task đúng scope chạy được; task ngoài scope bị chặn; high-risk output không tự thay đổi dữ liệu.

- [x] T114 [P] [US14] Tạo AI task, policy decision, provider usage, review và appeal entities trong `apps/api/src/modules/ai-governance/`
- [x] T115 [US14] Implement AI Gateway data permission/minimization, prompt/model version và provider adapter trong `apps/api/src/modules/ai-governance/` và `packages/integration-adapters/`
- [x] T116 [US14] Implement confidence/source/safety validation, high-risk review gate và manual fallback trong `apps/api/src/modules/ai-governance/`
- [x] T117 [US14] Implement AI jobs cho consultation, content, recommendation, dropout warning và anomaly detection trong `worker/src/jobs/ai-tasks/`
- [x] T118 [US14] Implement AI review, explanation, feedback và appeal UI trong `apps/web/src/app/admin/reporting/ai-review/`
- [x] T119 [US14] Add AI policy, scope, provider failure, high-risk approval and E2E tests trong `apps/api/tests/authorization/us14-ai.spec.ts` và `apps/web/tests/e2e/us14-ai.spec.ts`

## Phase 18: User Story 15 - Vận hành và báo cáo đa chi nhánh (P2)

**Goal**: Dashboard, reporting read model, export và scope-safe metrics cho marketing, LMS, HRM, finance, payroll và AI.

**Independent Test**: Tạo dữ liệu hai chi nhánh, lọc/export báo cáo và xác minh không trộn dữ liệu.

- [x] T120 [P] [US15] Tạo reporting projections/materialized read models cho branch, enrollment, learning, HRM, payroll và finance trong `apps/api/src/modules/reporting/`
- [x] T121 [US15] Implement dashboard filters, scoped metrics, empty states và report freshness metadata trong `apps/api/src/modules/reporting/`
- [x] T122 [US15] Implement async export jobs và permission-scoped file delivery trong `worker/src/jobs/reporting/` và `apps/api/src/shared/storage/`
- [x] T123 [US15] Implement executive, branch manager và finance/reporting dashboards trong `apps/web/src/app/admin/reporting/`
- [x] T124 [US15] Add report scope, accuracy, export and performance tests trong `apps/api/tests/authorization/us15-reporting.spec.ts` và `apps/web/tests/e2e/us15-reporting.spec.ts`

## Phase 19: Commercial Module and License Lifecycle

**Purpose**: Super-admin control plane, product plans, monthly/yearly/lifetime licenses, module dependencies, quotas, expiry and tenant isolation.

- [x] T125 [P] Tạo product plan, plan entitlement, license, license entitlement, license assignment và effective module state migrations trong `apps/api/src/modules/super-admin-license/`
- [x] T126 Implement super-admin plan/license issue, renew, revoke, override và audit APIs trong `apps/api/src/modules/super-admin-license/`
- [x] T127 Implement module install/enable/disable, dependency validation và backend license guards trong `apps/api/src/modules/module-registry/` và `apps/api/src/shared/module-guard/`
- [x] T128 Implement license verification sync, grace/expiry policy và selective module disable; module lõi và module còn entitlement vẫn hoạt động trong `apps/api/src/modules/license-runtime/`
- [x] T129 Implement super-admin license and tenant deployment UI trong `apps/web/src/app/(platform)/platform/license/` và `apps/web/src/app/(platform)/platform/tenants/`
- [x] T130 Add license signature, quota, expiry, grace, revoke, dependency and selective-disable tests trong `apps/api/tests/integration/license-lifecycle.spec.ts`

## Phase 20: Tenant Database Isolation and Migration

**Purpose**: SaaS database riêng từng tenant, dedicated instance, provisioning, backup, one-way migration và scheduled downtime.

- [x] T131 [P] Tạo tenant database registry, provisioning state, migration state và scheduled downtime entities trong `apps/api/src/modules/tenant-platform/`
- [x] T132 Implement tenant database provisioner, per-tenant migration runner, backup/restore metadata và quota isolation trong `apps/api/src/modules/tenant-platform/`
- [x] T133 Implement one-way SaaS-to-dedicated migration preflight, final sync, checksum/data validation và license activation trong `apps/api/src/modules/tenant-platform/`
- [x] T134 Implement scheduled maintenance/read-only mode, notice delivery, cutover, rollback và tenant B isolation trong `apps/api/src/modules/tenant-platform/` và `worker/src/jobs/tenant-migration/`
- [x] T135 Implement super-admin migration API/UI và deployment-state view trong `apps/api/src/modules/tenant-platform/` và `apps/web/src/app/(platform)/platform/tenants/migrations/`
- [x] T136 Add tenant isolation, migration, downtime, rollback and no-cross-tenant-impact E2E tests trong `apps/api/tests/integration/tenant-migration.spec.ts` và `apps/web/tests/e2e/tenant-migration.spec.ts`

## Phase 21: Polish & Cross-Cutting Concerns

- [x] T137 [P] Chạy accessibility, visual regression và theme preset tests cho Mantine trong `apps/web/tests/visual/` và `apps/web/tests/accessibility/`
- [x] T138 [P] Chạy load/capacity tests theo 50 branch, 100.000 student, 5.000 class và 100.000 library resource trong `tests/performance/`
- [x] T139 [P] Chạy resilience tests cho PostgreSQL failover, Redis restart, worker retry, provider timeout và queue backlog trong `tests/resilience/`
- [x] T140 [P] Tạo systemd units, Nginx config, native install, health check, backup, migration preflight và rollback scripts trong `infra/systemd/`, `infra/nginx/` và `infra/release-scripts/`
- [x] T141 [P] Tạo security hardening checklist cho Debian/Ubuntu, secrets, TLS, rate limits, headers, file access và audit retention trong `infra/security/` và `docs/security/`
- [x] T142 Chạy toàn bộ quickstart và ghi kết quả release gate trong `specs/001-lms-multi-branch/quickstart.md`; cập nhật file nếu có sai lệch
- [x] T143 Cập nhật tài liệu vận hành, module catalog, license catalog, API/OpenAPI và runbook migration trong `docs/`

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup không phụ thuộc phase khác.
- Phase 2 UI Foundation phụ thuộc Phase 1; Phase 3 Foundational Backend phụ thuộc Phase 1-2 và chặn mọi user story.
- Phase 4-17 user stories P1 phụ thuộc Phase 3; có thể chạy song song theo ownership sau khi foundation hoàn tất.
- Phase 18 US15 phụ thuộc dữ liệu từ các module báo cáo cần thiết; có thể bắt đầu read-model skeleton sau Phase 3 nhưng validation đầy đủ phụ thuộc các story tương ứng.
- Phase 19 Commercial License phụ thuộc Phase 3 và phải hoàn tất trước các module commercialized; có thể song song với academic stories sau foundation.
- Phase 20 Tenant Migration phụ thuộc Phase 19 và module tenant database foundation; không phụ thuộc hoàn tất mọi business story.
- Phase 21 Polish phụ thuộc các story/phases được chọn cho release và T160 nếu release gồm multimedia learning.
- Phase 22 phụ thuộc Phase 3; T144-T153 chặn T154-T159, và T160 chặn đóng US5/US8/US9 multimedia scope.

### User Story Dependencies

- US1 là MVP và phụ thuộc UI Foundation ở Phase 2 cùng Foundational Backend ở Phase 3; không phụ thuộc story khác.
- US2 phụ thuộc US1 cho organization/theme; nội dung public chỉ triển khai sau khi public shell ở Phase 2 được nghiệm thu.
- US3 phụ thuộc US2 lead form và US4 enrollment; cần US8 entrance assessment để hoàn thiện placement.
- US4 phụ thuộc US1 branch/access; là nền cho US5, US6, US10 và US12.
- US5 phụ thuộc US4 program/class và storage foundation ở Phase 3.
- US6 phụ thuộc US4 enrollment và US1 authorization; US7 có thể dùng conversation primitives từ US6.
- US7 phụ thuộc US6 communication context.
- US8 phụ thuộc US4 course/module và backend foundation ở Phase 3; US3 dùng entrance flow của US8.
- US9 phụ thuộc US8 assessment và US5 learning content.
- US10 phụ thuộc US4 schedule/class và integration primitives ở Phase 3.
- US11 phụ thuộc US4 enrollment; accounting sync có thể chạy song song sau Phase 3.
- US12 phụ thuộc US4 teacher assignment và US1 branch scope.
- US13 phụ thuộc US11 finance primitives, US12 attendance/teacher data và US1 branch scope.
- US14 phụ thuộc AI boundary ở Phase 3 và các domain data sources; high-risk actions cần US6/US8/US13 contracts.
- US15 phụ thuộc các read models và story data sources; dashboard shell có thể bắt đầu sớm.

### Parallel Opportunities

- Setup T002-T011 có thể chạy song song theo file ownership.
- Foundation T038-T040 có thể chạy song song sau primitives tương ứng.
- Sau Phase 2: US1, US4, US8, US11, US12, US14 và license foundation có thể bắt đầu song song.
- Trong mỗi story, entity migrations, UI shell, contract tests và provider adapter có thể song song nếu không sửa cùng file.
- US2 public pages có thể song song với US1 admin settings.
- US5 content processing worker có thể song song với content UI.
- US10 meeting adapter có thể song song với online session UI.
- US11 payment adapter và ERP worker có thể song song sau shared integration primitives.
- US12 HRM và US13 payroll có thể song song sau shared employee/attendance contracts.
- T137-T141 Polish có thể chạy song song trước T142 release validation.

## Parallel Example: MVP

```text
Track A: T001-T011 -> T012-T023 -> T041-T044 (organization/access/theme)
Track B: T024-T037 -> T038-T040 (integration, observability, foundational tests)
Track C: T003,T009 -> public/admin UI primitives

MVP checkpoint: T046 đạt independent test của US1.
```

## Implementation Strategy

### MVP First

1. Hoàn thành Phase 1 Setup.
2. Hoàn thành Phase 2 UI Foundation và Phase 3 Foundational Backend.
3. Hoàn thành US1: organization, branch, access, settings, theme và module visibility.
4. Chạy authorization, theme và native deployment smoke tests.
5. Dừng để validate MVP trước khi mở rộng business modules.

### Incremental Delivery

1. US1 + module/license runtime foundation: admin platform MVP.
2. US2 + US3 + US4: public acquisition và admission-to-class flow.
3. US5 + US6 + US8 + US9: learning, parent, assessment và English.
4. US10 + US11: online class và student billing/accounting.
5. US12 + US13: HRM, teacher management, branch finance và payroll.
6. US14 + US15: AI governance và executive reporting.
7. Phase 19-20: commercial licensing, tenant database isolation và migration.
8. Phase 21: performance, resilience, accessibility, native deployment và release gates.

## Task Format Validation

Tất cả implementation tasks đều theo format `- [ ] T### [P?] [US#?] Description with exact file path`. Setup/foundational/polish tasks không có story label; task thuộc user story có `[US#]`; task parallelizable có `[P]`. IDs nền tảng tuần tự từ T001 đến T143; multimedia supplement dùng T144 đến T160; full-stack readiness dùng T161 đến T175 và tuân cùng format/path requirement.

## Phase 22: Multimedia Learning and Assessment Foundation

**Purpose**: Triển khai nền tảng block lesson, upload/processing media, player/viewer, question registry và speaking response. Phase này phụ thuộc Phase 3 và phải hoàn tất trước khi đóng T067-T069, T083-T085, T088-T089.

### Schema and registry

- [ ] T144 [P] Tạo Zod contracts versioned cho `LessonDocument`, các MVP `LessonBlock`, `QuestionTypeDefinition`, answer payload và migration registry trong `packages/domain-contracts/src/learning/`
- [ ] T145 Tạo internal plugin registry cho lesson editor/renderer và question authoring/attempt/review/scoring trong `apps/web/src/features/learning/registry/` và `apps/api/src/modules/academic-learning/registry/`; từ chối executable tenant plugin
- [ ] T146 [P] Tạo migrations/entities cho `LessonDocument`, `LessonBlockDefinition`, `MediaAsset`, `MediaDerivative`, `MediaUploadSession`, `MediaProcessingJob`, `CaptionTrack`, `Transcript`, `AttemptAnswer` và `ManualReview` trong các module academic/assessment

### Upload and processing

- [ ] T147 Tạo media upload API với Uppy handoff, S3 multipart hoặc tus, checksum, MIME detection, quota, idempotent complete và private scope trong `apps/api/src/shared/storage/` và `apps/web/src/components/media/media-uploader.tsx`
- [ ] T148 [P] Tạo scan/ingest state machine và worker retry/dead-letter trong `worker/src/jobs/media-processing/ingest.ts`
- [ ] T149 [P] Tạo image pipeline bằng Sharp cho metadata, orientation, metadata stripping, thumbnail và WebP/AVIF derivative trong `worker/src/jobs/media-processing/image.ts`
- [ ] T150 [P] Tạo audio pipeline bằng FFmpeg/ffprobe cho metadata, codec normalization, loudness và waveform metadata trong `worker/src/jobs/media-processing/audio.ts`
- [ ] T151 [P] Tạo video adapter/pipeline cho metadata, poster, thumbnail, HLS renditions hoặc external provider mapping trong `worker/src/jobs/media-processing/video.ts` và `packages/integration-adapters/src/video/`
- [ ] T152 [P] Tạo slide/PDF pipeline bằng LibreOffice headless và PDF tooling cho PPTX-to-PDF, page count và thumbnail trong `worker/src/jobs/media-processing/document.ts`
- [ ] T153 Tạo signed playback/download token service, expiry, authorization recheck và progress API trong `apps/api/src/shared/storage/playback.service.ts`

### Authoring and playback

- [ ] T154 Tạo `LessonComposer` bằng TipTap và block controls, reorder, draft autosave, preview, schema error và publish readiness trong `apps/web/src/features/learning/authoring/`
- [ ] T155 [P] Tạo `ImageViewer`, `AudioPlayer`, `VideoPlayer`, `SlideViewer`, `TranscriptViewer` và `MediaProcessingStatus` với Mantine/Vidstack/WaveSurfer/PDF.js trong `apps/web/src/components/media/`
- [ ] T156 Tạo `LessonRenderer` responsive, keyboard accessible, progress/resume và permission-safe trong `apps/web/src/features/learning/player/`

### Assessment and speaking

- [ ] T157 Tạo MVP question editors/renderers cho choice, true/false, text, fill blank, matching, ordering, image/audio/video prompt, file upload và speaking trong `apps/web/src/features/assessment/question-types/`
- [ ] T158 Tạo `VoiceRecorder` bằng MediaRecorder/Web Audio với permission, device check, record/pause/review/retry, duration limit và resumable upload trong `apps/web/src/components/media/voice-recorder.tsx`
- [ ] T159 Tạo autosave sequence, connectivity state, retry-safe submit, media answer binding và manual review/rubric/timestamp feedback trong API, worker và assessment UI

### Validation gates

- [ ] T160 Chạy schema migration, malicious payload, upload resume/duplicate, MIME spoof, processing retry, signed URL expiry, cross-scope playback, autosave out-of-order, speaking mobile/keyboard và visual E2E tests trong `apps/api/tests/media/`, `worker/tests/media/` và `apps/web/tests/e2e/multimedia/`

**Checkpoint**: Lesson multimedia và assessment media MVP chỉ hoàn tất khi source private, processing state trung thực, renderer/editor schema parity, autosave sequence và speaking manual review đều qua T160.

## Phase 23: Full-Stack Delivery Readiness

**Purpose**: Bổ sung các quyết định và hạ tầng còn thiếu để đội phát triển có thể triển khai, kiểm thử, bảo mật và vận hành toàn bộ stack nhất quán.

- [ ] T161 Chốt package manager duy nhất, Node version, Corepack policy và reproducible install; loại workspace config cạnh tranh và thêm `.nvmrc`/`.node-version`, `engines`, lockfile policy trong repository root
- [ ] T162 [P] Tạo root `README.md`, `CONTRIBUTING.md`, architecture map, local onboarding và command catalog cho web/API/worker/test/migration/seed trong `README.md` và `docs/development/`
- [ ] T163 [P] Tạo typed environment schemas và `.env.example` không chứa secret cho web/API/worker; validate fail-fast, phân loại public/private secret và document rotation trong `packages/config/` và `infra/environments/`
- [ ] T164 Chốt PostgreSQL data-access/migration stack, transaction convention, naming, decimal/timezone strategy và tenant connection pooling; tạo ADR và migration smoke test trong `docs/adr/` và `apps/api/src/database/`
- [ ] T165 [P] Tạo local development service profile không Docker theo baseline production, gồm scripts kiểm tra PostgreSQL, Redis, S3-compatible storage và optional sandbox adapters trong `infra/development/`
- [ ] T166 [P] Chuẩn hóa API `/v1`, OpenAPI source/generation, DTO/schema compatibility, CORS, CSRF, cookie/session, rate limit, request size, webhook raw-body và security headers trong `apps/api/src/shared/http/`
- [ ] T167 Chốt authentication ADR gồm email/password, password reset, session cookie, MFA policy, super-admin isolation, SSO extension point, account recovery và session revocation trong `docs/adr/authentication.md`
- [ ] T168 [P] Tạo notification provider contracts cho email, SMS và in-app; template localization, opt-out, retry, delivery receipt và sandbox adapter trong `packages/integration-adapters/src/notification/`
- [ ] T169 [P] Tạo privacy/data governance matrix cho consent, retention, legal hold, data export/delete/anonymize, minors/parent delegation, AI data use và audit redaction trong `docs/security/privacy-retention.md`
- [ ] T170 [P] Tạo backup encryption/key management, restore drill, RPO/RTO, object storage lifecycle, malware quarantine và secret rotation runbooks trong `infra/backup/` và `docs/operations/`
- [ ] T171 [P] Tạo deterministic seed/factory cho hai tenant, nhiều branch và mọi persona; sample media không nhạy cảm và reset-safe development data trong `packages/test-fixtures/` và `apps/api/src/database/seeds/`
- [ ] T172 Tạo CI quality gates cho install, format/lint, typecheck, unit, contract, authorization, migration, build, dependency/license scan, secret scan và artifact checksum trong `.github/workflows/ci.yml`
- [ ] T173 [P] Tạo GitHub issue/PR templates, CODEOWNERS, branch protection checklist, Dependabot/Renovate policy, security reporting và release/versioning convention trong `.github/`
- [ ] T174 Chốt provider decision records và sandbox credentials process cho payment, meeting, accounting/ERP, AI, object storage và video transcoding trước task adapter production trong `docs/adr/providers/`
- [ ] T175 Tạo full-stack readiness gate kiểm tra toàn bộ mục trong `checklists/full-stack-readiness.md`; không bắt đầu production rollout khi còn mục Critical chưa đạt

**Checkpoint**: Full-stack implementation có thể bắt đầu theo MVP sau T161-T167 và T171-T172; production integration/rollout yêu cầu hoàn tất T168-T175 cùng các release gate tương ứng.
