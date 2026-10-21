# Implementation Plan: LMS đa ngành đa chi nhánh

**Branch**: `001-lms-multi-branch` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-lms-multi-branch/spec.md`

## Summary

Xây dựng nền tảng LMS web responsive cho trung tâm đào tạo đa ngành, đa chi nhánh, kết hợp public landing page, tuyển sinh/CRM, học tập, thư viện số, đánh giá và hồ sơ năng lực theo chương trình/môn, lộ trình đặc thù như Tiếng Anh, lớp online, phụ huynh, trao đổi, HRM, giáo viên, payroll, tài chính chi nhánh, kế toán/ERP và AI tự động hóa có kiểm soát.

Kiến trúc được chọn là frontend public/authenticated sử dụng Mantine, backend modular monolith stateless được tổ chức thành các module có manifest và license gate, worker bất đồng bộ, PostgreSQL làm nguồn dữ liệu giao dịch, Redis cho cache/queue, private object storage cho file và adapter riêng cho payment, meeting, accounting/ERP và AI. Hệ thống triển khai trực tiếp trên Debian/Ubuntu bằng Node.js, Nginx và systemd, không sử dụng Docker. Outbox/inbox, idempotency, audit, authorization và license enforcement theo organization/branch/module scope là các cơ chế nền tảng.

## Technical Context

**Language/Version**: TypeScript 5.x trên Node.js LTS.

**Primary Dependencies**: Next.js 15 App Router cho public/authenticated web; React 19; Mantine được khởi tạo theo cấu hình chuẩn với Mantine components, CSS Modules/Mantine styles và semantic theme tokens; NestJS cho backend modular monolith, PostgreSQL, Redis với queue worker, S3-compatible private object storage, TipTap, Zod, Uppy với multipart/tus, Vidstack, WaveSurfer.js, PDF.js/react-pdf, FFmpeg/ffprobe, Sharp, LibreOffice headless, OpenAPI contracts, provider adapters, Nginx và systemd. React Router không được sử dụng trong `apps/web`.

**Storage**: PostgreSQL cho dữ liệu giao dịch, module registry, license, entitlement và audit metadata; Redis cho cache/queue/lock ngắn hạn; S3-compatible private object storage cho source/derivative media, học liệu, bài nộp, chứng từ, phiếu lương và recording; PostgreSQL lưu media metadata, lesson/question schema version và processing state.

**Testing**: Vitest cho unit/integration logic, Playwright cho E2E, contract tests cho provider adapters và license checks, authorization/module matrix, performance, resilience và restore/migration validation.

**Target Platform**: Web responsive trên Debian 12+ hoặc Ubuntu LTS; Next.js chạy public/authenticated web, NestJS API và Node.js worker chạy trực tiếp dưới systemd; Nginx làm reverse proxy/TLS; PostgreSQL, Redis và object storage có thể managed hoặc cài native; không sử dụng Docker.

**Project Type**: Web application gồm public landing page, authenticated portals, backend API, background workers và external integrations.

**Performance Goals**:

- Hỗ trợ tối thiểu 50 chi nhánh, 100.000 học viên, 5.000 lớp hoạt động và 100.000 tài nguyên thư viện.
- Cập nhật tiến độ/điểm danh hiển thị trong tối đa 5 giây.
- Kết quả thi tự động trong tối đa 10 giây sau khi nộp.
- Thanh toán đã xác nhận cập nhật công nợ và biên nhận trong tối đa 1 phút.
- Báo cáo lọc theo chi nhánh/ngành/thời gian hoàn tất trong tối đa 2 phút.

**Constraints**:

- Mọi thao tác phải áp dụng organization/branch/student scope ở backend.
- Dữ liệu tài chính, payroll, điểm, bài làm, audit và đồng bộ không được xóa vật lý tùy tiện.
- Thanh toán và ERP phải chống xử lý trùng; webhook phải xác thực và có reconcile.
- Payroll đã khóa chỉ được thay đổi qua adjustment workflow.
- AI được tự động hóa cao nhưng quyết định ảnh hưởng điểm, lương, quyền lợi, kỷ luật hoặc gian lận phải có human review.
- File giới hạn quyền phải ở private storage và chỉ cấp URL sau authorization.
- Lesson/assessment dùng JSON schema versioned và registry nội bộ cho block/question type; không cho tenant nạp executable plugin.
- Upload lớn phải resumable/multipart, idempotent và không chuyển ready trước scan/processing; media worker dùng pipeline versioned, retry/dead-letter và giữ source.
- Runtime player, recorder, uploader và assessment engine không phụ thuộc MCP; MCP chỉ dùng cho development hoặc AI integration qua policy boundary.
- Dữ liệu cá nhân, học tập, nhân sự, lương, tài chính và AI phải tuân thủ chính sách bảo mật/retention của trung tâm.
- UI phải dùng Mantine components và Mantine theme APIs và semantic design tokens; không tự mô phỏng component đã có, không hard-code màu, font, spacing hoặc radius thương hiệu trong component nghiệp vụ; preset/theme mới phải thay được mà không sửa logic màn hình.
- UI mặc định dùng locale `vi` và dark theme khi chưa có lựa chọn lưu trước; hỗ trợ chuyển `vi`/`en` và light/dark/system, lưu hai lựa chọn độc lập, không gây flash sai theme/locale khi tải trang.
- `apps/web` chỉ dùng Next.js App Router. Route groups `(public)`, `(platform)` và LMS application có layout boundary riêng; dùng nested `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `next/link` và `next/navigation`; không dùng React Router.
- Server Components là mặc định; Client Components chỉ xuất hiện ở boundary nhỏ nhất cần state, browser API hoặc interactive Mantine component. Data fetching và authorization ban đầu ưu tiên thực hiện phía server.
- Application shell, core component catalog, theme và responsive behavior phải được nghiệm thu bằng Playwright visual/accessibility tests trước khi mở rộng màn hình nghiệp vụ.
- Mỗi business module phải có manifest, dependency, navigation contribution, migrations, permissions, jobs và license feature key; backend luôn enforce entitlement, không chỉ ẩn menu ở frontend.
- Module lõi identity, organization, authorization, audit, module registry và license runtime không được tắt; module phụ thuộc không được bật khi dependency chưa có.
- License hỗ trợ monthly, yearly, lifetime, thời gian hiệu lực, grace period, giới hạn module và quota; thay đổi license phải audit và có cơ chế đồng bộ/kiểm tra chữ ký.
- Triển khai production không dùng Docker; release phải có artifact versioned, migration, systemd units, Nginx config, rollback và backup/restore runbook.

**Scale/Scope**: 15 nhóm luồng nghiệp vụ cùng một luồng UI foundation, 103 functional requirements và 38 success criteria bao phủ đánh giá/hồ sơ năng lực đa ngành, propagation sang student/parent portals và change/UI governance; phiên bản đầu gồm application shell/design system, identity/organization, module registry/license runtime, public landing, CRM/admission, academic/LMS, assessment/competency profiles, lộ trình đặc thù theo môn (bao gồm English), online class, parent/communication, HRM/teacher, payroll/branch finance, accounting integration, reporting và AI governance.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 1.1.0 trong `.specify/memory/constitution.md` đã được phê chuẩn và quy định rõ Next.js App Router, Mantine component system, Server Component mặc định, ba layout boundary cùng UI foundation acceptance gate.

Plan tuân thủ các baseline bắt buộc từ constitution và rủi ro hệ thống:

- Authorization theo scope và negative access testing.
- Audit cho bảo mật, tài chính, payroll, AI và thay đổi dữ liệu nhạy cảm.
- Integration contract tests cho payment, meeting, ERP và AI.
- Transaction boundary, outbox/inbox, idempotency và reconciliation.
- Human review cho quyết định AI rủi ro cao.
- Không xóa lịch sử tài chính, payroll, điểm, bài làm và audit.
- Quickstart phải kiểm chứng các luồng P1 và trường hợp retry/duplicate.

**Gate status**: PASS for planning; implementation vẫn phải tuân thủ các quality gates và exception process trong constitution.

## Phase 0: Research Summary

Research đã được ghi tại [research.md](./research.md), gồm:

- Modular monolith + worker thay cho microservices ban đầu.
- Public/authenticated web experience.
- PostgreSQL làm transactional source of truth.
- Private object storage và pipeline xử lý source/derivative cho image, audio, video, slide/PDF và speaking response.
- Outbox/inbox/idempotency cho payment, meeting và ERP.
- AI Gateway với policy, audit, confidence, explanation và human review.
- Mantine với semantic theme tokens và preset versioning.
- Module manifest, dependency graph và backend entitlement enforcement.
- Super-admin license control plane với monthly/yearly/lifetime, signed license, quota và grace period.
- Native deployment trên Debian/Ubuntu bằng Nginx, systemd và versioned release artifact, không Docker.
- Chiến lược test theo rủi ro cho quyền, module, license, theme, deployment và tích hợp.

## Phase 1: Design Summary

Design artifacts:

- [data-model.md](./data-model.md): entity, quan hệ, trạng thái và validation rules cho identity, LMS, HRM, payroll, branch finance, integrations và AI.
- [contracts/api-contracts.md](./contracts/api-contracts.md): public/API contracts, authenticated commands, webhooks, AI task và invariant.
- [contracts/integration-contracts.md](./contracts/integration-contracts.md): payment, meeting, accounting/ERP và AI provider adapters.
- [quickstart.md](./quickstart.md): scenario kiểm chứng scope, tuyển sinh, delegation, payment, payroll, online class, assessment, AI và performance.

## Project Structure

### Documentation (this feature)

```text
specs/001-lms-multi-branch/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── api-contracts.md
│   └── integration-contracts.md
├── quickstart.md
├── change-impact-template.md
├── current-state-audit.md
└── tasks.md              # tạo bởi /speckit-tasks
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── src/
│   │   ├── app/                 # Next.js App Router duy nhất
│   │   │   ├── (public)/        # landing layout, không dùng admin shell
│   │   │   ├── (platform)/      # license control plane layout
│   │   │   └── admin/           # LMS application layout
│   │   ├── components/
│   │   │   ├── ui/              # wrapper/composition quanh Mantine, không chứa domain logic
│   │   │   ├── shell/           # sidebar/header/footer/breadcrumb/page frame
│   │   │   └── domain/          # composition theo nghiệp vụ
│   │   ├── lib/
│   │   │   ├── navigation/      # typed nav manifests theo product boundary
│   │   │   ├── theme/           # semantic tokens và preset runtime
│   │   │   └── i18n/
│   │   └── services/            # server-side API clients và DTO mapping
│   └── tests/
│       ├── e2e/
│       └── contract/
├── api/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── identity-access/
│   │   │   ├── organization-branch/
│   │   │   ├── module-registry/
│   │   │   ├── license-runtime/
│   │   │   ├── super-admin-license/
│   │   │   ├── marketing-admission/
│   │   │   ├── academic-learning/
│   │   │   ├── assessment-competency/
│   │   │   ├── online-class/
│   │   │   ├── communication/
│   │   │   ├── hrm-teacher/
│   │   │   ├── payroll-finance/
│   │   │   ├── reporting/
│   │   │   ├── ai-governance/
│   │   │   └── integrations/
│   │   ├── shared/
│   │   └── migrations/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── authorization/
│       └── contract/
└── worker/
    ├── src/
    │   ├── jobs/
    │   │   ├── notifications/
    │   │   ├── payment-reconciliation/
    │   │   ├── accounting-sync/
    │   │   ├── meeting-sync/
    │   │   ├── payroll/
    │   │   ├── reporting/
    │   │   ├── content-processing/          # image/audio/video/slide ingest và derivatives
    │   │   ├── media-processing/
    │   │   └── ai-tasks/
    │   └── shared/
    └── tests/
        ├── unit/
        └── integration/

packages/
├── domain-contracts/
├── authorization/
├── module-sdk/              # manifest, dependency và entitlement guards
├── license-contracts/       # signed document, verifier và quota rules
├── integration-adapters/
├── ui/                      # shared contracts hiện hữu, không sao chép registry components
├── theme-presets/           # Mantine-compatible semantic token presets
└── test-fixtures/

infra/
├── environments/
├── migrations/
├── nginx/
├── systemd/
├── release-scripts/         # install, health check, rollback, backup
├── observability/
└── secrets/
```

**Structure Decision**: Chọn monorepo với ba runtime chính: `apps/web` cho public site, license control plane và LMS application; `apps/api` cho modular monolith API cùng super-admin license logic; `worker` cho queue/scheduled jobs. `apps/web` dùng duy nhất Next.js App Router và ba layout boundary tách biệt; không thêm React Router. `components/ui` chứa wrapper/composition dùng chung quanh Mantine, không sao chép source thư viện, `components/shell` composition application shell và `components/domain` composition nghiệp vụ. `packages/module-sdk` chuẩn hóa manifest và entitlement guard; `packages/license-contracts` giữ signed license schema/verifier; `packages/theme-presets` giữ preset và semantic tokens. `infra/` chứa migration, Nginx, systemd, release/rollback scripts, observability và secret references cho deployment Debian/Ubuntu không Docker.

## Phase 1 Design Gates

Sau khi tạo design artifacts, các gate sau được đánh giá:

- [x] Scope đa chi nhánh biểu diễn ở data model và contract.
- [x] Parent delegation có entity, expiry và authorization invariant.
- [x] Payment/ERP/meeting có idempotency, webhook validation, retry và reconcile.
- [x] Payroll có period lock, versioned calculation và adjustment workflow.
- [x] AI có policy check, audit, confidence, review và manual fallback.
- [x] Mantine được cô lập ở primitive/theme layer và hỗ trợ preset qua semantic tokens.
- [x] Next.js App Router là router duy nhất; ba route/layout boundary và Server Component boundary đã được xác định.
- [x] Application shell public, license control plane và LMS application được tách biệt; UI foundation có visual, responsive, keyboard, accessibility, theme và deep-link gates.
- [x] Module manifest, dependency graph, effective state và backend entitlement guard đã được thiết kế.
- [x] License tháng/năm/trọn đời, grace, revoke, quota, chữ ký và super-admin control plane đã được thiết kế.
- [x] Debian/Ubuntu native deployment có Nginx, systemd, release artifact và rollback plan; không dùng Docker.
- [x] Quickstart bao phủ các luồng P1, lỗi provider, theme preset, license lifecycle và native deployment.
- [x] Constitution chính thức đã được ratify và không còn placeholder.

**Post-design gate status**: PASS; stack, deployment, module/license, tenant isolation và migration đã được chốt ở mức planning.

## Cross-module adjustment plan: competency-first, multi-subject

| Phase | Scope | Main adjustment | Gate / output |
|---|---|---|---|
| 0. Contract baseline | Requirements and terminology | Replace English-only pathway/profile terms with subject/program competency concepts; define blueprint, evidence, baseline, current and target semantics. | Approved glossary and acceptance scenarios in `spec.md` and `data-model.md`. |
| 0A. Change governance | User-originated changes | Record each request, run cross-role/module impact analysis, identify owner/permissions/propagation, update spec, role matrix, UI and tests before implementation; close each item with evidence, residual risk and a next-step handoff; continue after approved scope without repeated confirmation. | No change item proceeds without impact record and affected-role decision; no item is fully closed without a next-step record or an explicit reopen condition. Pause only for a genuine blocker or material scope/risk/owner decision. |
| 1. Academic configuration | Program and subject setup | Add competency definitions, score scales, rubrics, normalization policies, placement thresholds and target outcomes to each program version. | Mathematics, Literature and English sample blueprints pass configuration tests. |
| 2. Assessment | Admission, entrance and mock | Make every assessment reference subject/program and blueprint version; publish result as immutable competency evidence instead of directly overwriting a profile. | Entrance and mock contract tests prove correct evidence creation and no cross-program leakage. |
| 3. Competency profile | Teacher and student views | Build one shared profile by student + subject/program with baseline/current/target, evidence timeline, confidence, four-skill English when configured, and explicit not-assessed/out-of-scope states. | Same record is returned from global profile view and class-scoped view. |
| 4. Class integration | Roster, scores, assignments and feedback | Add class/program context and “open competency profile” action; class observations use the assigned rubric and contribute evidence only after confirmation. | Class transfer preserves profile history and class references remain auditable. |
| 4A. Portal propagation | Student and parent self-service | Class outputs are classified as published learning output, internal operational state or sensitive evidence; sync published schedule/material/score/attendance/feedback/competency evidence to student and delegated parent views. | Student/parent see the same canonical result with no draft/private leakage and no duplicate data entry. |
| 5. Admission and pathway | Consultation and placement | Derive assessment assignment and placement recommendation from learner goal and program blueprint; activate a versioned pathway without assuming English. | Consultant → assessment → academic handoff scenario passes for at least three subjects. |
| 6. Reporting and communication | Reports, parent and internal exchange | Add subject/program/competency dimensions to filters and report read models; link messages to evidence or review context without exposing unauthorized detail. | Branch and program reports reconcile with profile source data and scope tests. |
| 7. Migration and deprecation | Existing English UI/data | Map current EnglishSkillRecord/EnglishPathway data into generic profiles and evidence; keep `/teacher/english` as a compatibility redirect to the generic `/teacher/competency` route while the new profile UI is validated. | Migration is idempotent, audit-preserving, class-context aware and no duplicate evidence/profile version is created. |
| 8. Verification | End-to-end quality | Test mixed cohorts, missing/out-of-scope competencies, multiple classes, class transfer, regrade/versioning, filters, authorization and mobile views. | All P1 gates and new SC-035..SC-038 pass before broad UI rollout. |
| 9. UI normalization | Existing and new data screens | Audit every list screen for duplicate primary/secondary tables; consolidate repeated data into one table with row action column, modal edit and confirmed archive/void/delete behavior. | Table/modal checklist passes for teacher, class, assessment, admission, student, parent, finance and HR screens. |

### Teacher workspace decisions confirmed

- Rename the teacher navigation item from `Rà soát tiếng Anh` to `Hồ sơ năng lực`; keep `/teacher/english` as a compatibility route until the generic profile route is ready.
- Move `Buổi dạy & worklog` to the teacher `Cá nhân` section next to `Lương & công dạy`; class sessions retain the contextual worklog action.
- Allow teaching assistants to grade and capture evidence only inside assigned class/program competency scope; entrance/mock review and baseline/current approval require explicit permission.
- Restrict teacher entrance/mock/profile access to assigned subject, program, branch, class and certification scope; do not expose a cross-center queue by default.

### Review checklist for related features

- Does the feature identify subject, program and blueprint version instead of assuming English?
- Does it write a score/result or create competency evidence, and which owner approves that transition?
- Can the same learner have multiple programs/classes without overwriting another profile?
- Are not-assessed and out-of-scope states distinct?
- Does the UI show class context while keeping the canonical profile outside the class?
- Are raw score, normalized level, source, confidence, reviewer and audit history available?
- Can filters and reports scope by branch, subject, program, class, competency and time?
- Does a class change produce the right student/parent view and notification without exposing worklog, drafts, private notes or internal review data?
- Is every parent-visible learning result authorized by an independent delegation permission?
- Is the request recorded as a change item with an impact analysis covering every affected role/module?
- Does completion record verification evidence, residual risk and a next step with owner, priority and start condition (or an explicit reopen condition)?
- After approval, can implementation continue without repeating confirmation unless a blocker or material scope/risk/owner decision appears?
- Does every table-plus-subtable pattern have a documented reason, or can it be consolidated into one table with row actions?
- Does edit use a validated modal and does delete use confirmation plus archive/void/adjustment for immutable records?

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Worker runtime riêng | Payroll, payment/ERP, meeting, report và AI cần retry, scheduling và xử lý dài | Chạy tất cả trong API request làm tăng timeout, duplicate side effects và giảm khả năng phục hồi |





