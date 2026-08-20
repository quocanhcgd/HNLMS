# Data Model: LMS đa ngành đa chi nhánh

**Feature**: `001-lms-multi-branch`

## Quy ước chung

- Mọi entity tenant có `organization_id`; entity theo chi nhánh có `branch_id` hoặc scope tương đương.
- Entity nhạy cảm có timestamp, trạng thái và audit history; không xóa vật lý tài chính, payroll, điểm, bài làm, audit hoặc bản ghi đồng bộ đã chốt.
- File lớn ở private object storage; database lưu metadata, hash, owner, derivative, processing state và access policy.
- Schema nội dung, lesson block và question type phải có `schema_version`, runtime validation và migration tiến về trước.

## Identity, organization và authorization

### Organization, TenantInstance, ScheduledDowntime, Branch

- `Organization`: id, name, brand/contact settings, timezone, academic period, status, database instance/name, deployment mode, migration state.
- `TenantInstance`: organization, endpoint, database name, deployment/provisioning/migration state, cutover, downtime.
- `ScheduledDowntime`: organization, tenant instance, reason, start/end, status, notice, creator.
- `Branch`: organization, code, name, address, manager, status, opened/closed dates.

Rules: mỗi organization dùng database riêng; migration SaaS sang dedicated là một chiều, có backup, final sync, validation, cutover và rollback. Branch inactive không nhận nghiệp vụ mới nhưng giữ lịch sử.

### User, Role, Permission, ScopeGrant, AuditEvent

- `User`: đăng nhập, profile, trạng thái và liên kết nhân sự/học viên.
- `Role`: tên và tập permission; `Permission`: resource/action.
- `ScopeGrant`: user, organization, branch, class, student, effective period.
- `AuditEvent`: actor, action, entity, before/after, result, correlation ID, occurred time; append-only.

Rules: backend kiểm tra scope trên mọi read/write/export; UI visibility không thay authorization.

## Module, license và theme

- `ModuleDefinition`: key, name, version, core, dependencies, feature key, permissions, routes, navigation, jobs, migration version, status.
- `ProductPlan`, `PlanEntitlement`: term, module entitlement, quota và policy versioned.
- `License`, `LicenseEntitlement`, `LicenseAssignment`: term monthly/yearly/lifetime, start/expiry/grace, signature, assignment và verification.
- `EffectiveModuleState`: installed, configured, licensed, dependency satisfied, effective, reason.
- `BrandTheme`: Mantine-compatible semantic tokens, light/dark, font, radius, logo, version, status.

Rules: core module không tắt; dependency graph không vòng lặp; signed license xác minh local; theme phải qua contrast validation trước publish.

## Marketing và tuyển sinh

- `LandingContent`: type, slug, localized title/summary/body/media, publication state, version.
- `Lead`: contact, source, branch/program interest, consent, status.
- `Consultation`: lead, consultant, notes, next action, occurred time.
- `LeadAssignment`: lead, branch, consultant, assignment lifecycle.

Rules: chỉ nội dung published xuất hiện public; lead trùng được nhận diện theo policy; contact/consent được audit.

## Academic core và learning content

- `Department`, `Program`, `Course`, `Module`: cấu trúc chương trình, mục tiêu, thứ tự, completion rules và publication state.
- `Class`, `Schedule`, `Enrollment`: branch, modality, capacity, teacher, resource/time, student, progress và finance reference.
- `Student`, `ParentLink`, `Delegation`: profile và permission riêng theo từng student.
- `LibraryResource`: metadata, category, subject, access scope, usage policy, version và status.

### LearningContent và LessonDocument

- `LearningContent`: owner, title, locale, content type, current version, approval status, access scope, estimated duration.
- `LessonDocument`: learning content, schema version, ordered block references, publication snapshot, created by/at.
- `LessonBlock`: document, stable block id, block type, schema version, position, validated payload, accessibility metadata.
- `LessonBlockDefinition`: plugin key, schema version, editor/renderer capability, migration key, module/license requirement, status.

MVP block types: rich text, heading, callout, image, gallery, audio, video, slide/PDF, attachment, quiz checkpoint, flashcard, vocabulary và speaking prompt.

Rules:

- JSON block document là nguồn nội dung chính; không dùng HTML tùy ý làm nguồn duy nhất.
- Block definition là registry nội bộ có type contract; tenant không được upload JavaScript plugin tùy ý.
- Phiên bản đã được học viên sử dụng không bị ghi đè hoặc xóa; publish tạo immutable snapshot.
- Locale, alt text, caption, transcript/caption reference và keyboard accessibility được validation theo block type.

### MediaAsset và processing

- `MediaAsset`: owner, organization, source filename, MIME detected, size, checksum, storage key, media kind, access scope, upload state, scan state, processing state, duration/dimensions/pages, retention class.
- `MediaDerivative`: source asset, derivative kind, codec/format, resolution/bitrate, storage key, checksum, processing version.
- `MediaUploadSession`: asset, multipart/tus session, parts, expiry, idempotency key, status.
- `MediaProcessingJob`: asset, operation, tool/pipeline version, state, attempts, error, started/completed time.
- `CaptionTrack`: media asset, locale, format WebVTT, source manual/provider, status, version.
- `Transcript`: media asset, locale, timed segments, source, review status, version.
- `MediaProgress`: enrollment/user, asset/content, position, completion state, updated time.

Rules:

- URL phát/tải chỉ cấp sau authorization và có thời hạn; source và derivative đều private.
- Server xác minh MIME/checksum/quota; redirect hoặc client metadata không được tin cậy.
- Pipeline MVP gồm virus scan, image derivative, audio normalization, video metadata/thumbnail/HLS hoặc provider adapter, slide-to-PDF/thumbnail và search indexing.
- Upload file lớn hỗ trợ multipart/resumable, retry và idempotency; processing lỗi không làm mất source.

## Assessment, practice và English

### QuestionDefinition registry

- `QuestionTypeDefinition`: plugin key, schema version, authoring/attempt/review capability, scoring strategy key, migration key, status.
- `AssessmentBankItem`: type key, schema version, localized prompt, media references, skill, topic, difficulty, answer schema, scoring config, approval state, version.
- `Assessment`: entrance/mock/practice, blueprint, window, attempts allowed, time limit, scoring policy, result visibility.
- `AssessmentAttempt`: assessment, candidate, start/expiry/submit, state, draft version, connectivity state.
- `AttemptAnswer`: attempt, item version, validated answer payload, media response reference, save sequence, saved time.
- `AssessmentResult`: total, skill/topic scores, recommendations, publication state.
- `ManualReview`: answer, reviewer, rubric, score, timestamp feedback, state.

MVP question types: single choice, multiple choice, true/false, short/long answer, fill blank, matching, ordering, image choice, audio/video prompt, file upload và speaking response.

Rules:

- Question renderer/editor/review dùng registry nội bộ và Zod/runtime schema; không tải code plugin không tin cậy.
- Attempt creation và submit idempotent; autosave dùng monotonic sequence để không ghi đè bản mới bằng request cũ.
- Media response liên kết asset có scope attempt; speaking/writing ở trạng thái chờ chấm cho đến manual review.
- Answer/result immutable sau publish; điều chỉnh tạo version/audit mới.

### EnglishPathway, EnglishSkillRecord

- Pathway gồm level, module và placement rules.
- Skill record tách listening, speaking, reading, writing; có score, evidence và assessed time.

## Online class, communication, HRM và finance

- `OnlineSession`: class, provider meeting, join/host reference, schedule, attendance sync, recording, status.
- `Conversation`, `ConversationMember`, `Message`, `Notification`: context, membership, immutable message history và delivery/read state.
- `EmployeeProfile`, `EmploymentContract`, `TeacherAssignment`, `WorkSchedule`, `Attendance`, `LeaveRequest`, `PerformanceReview`.
- `PayrollPeriod`, `PayrollLine`, `Payslip`: calculation version, approval/lock và adjustment.
- `Budget`, `FinanceCategory`, `CashAccount`, `FinanceEntry`, `ExpenseRequest`, `ReceiptDocument`.
- `Invoice`, `PaymentTransaction`, `Refund`, `AccountingSync`.

Rules: recording private; membership theo scope; payroll locked chỉ điều chỉnh qua workflow; payment/webhook/accounting có idempotency và reconciliation.

## AI governance và integration primitives

- `AITask`, `AIPolicyDecision`, `AIReview`: purpose, scope, redaction, model/prompt version, source, confidence, review/appeal.
- `OutboxEvent`, `InboxEvent`: stable event/idempotency key, payload version, retry/dead-letter state.

Rules: AI không tự đổi điểm, lương, quyền lợi, kỷ luật hoặc kết luận gian lận; MCP nếu có chỉ là integration boundary có kiểm soát cho AI/development, không là dependency runtime của player, recorder, upload hoặc assessment engine.
