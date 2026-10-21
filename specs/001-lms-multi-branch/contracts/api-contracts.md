# API Contracts: LMS đa ngành đa chi nhánh

**Feature**: `001-lms-multi-branch`

## Quy tắc chung

- Request authenticated mang server-derived organization/branch/student scope; không tin role/scope do client gửi.
- Lỗi có `code`, `message`, `correlation_id`, `details`; không lộ dữ liệu nhạy cảm.
- Side effect tài chính, enrollment, upload, submit và integration hỗ trợ idempotency.
- Danh sách lớn phân trang; export bất đồng bộ; timestamp ISO 8601; tiền dùng decimal chính xác.
- Business endpoint bị từ chối nếu module effective disabled.

## Public và context

- `GET /public/programs`: catalog published theo branch/department/pagination.
- `POST /public/consultations`: contact, interest, source, consent và `client_submission_key`.
- `GET /me/context`: profile, roles, scopes, effective modules và quotas cho UI.
- `GET|PUT /organization/modules/{module_key}`: effective state/configured state; backend kiểm tra entitlement/dependency.
- `GET /organization/theme`, `POST /organization/themes/preview`, `POST /organization/themes/{version}/publish`.

## Enrollment và billing

- `POST /enrollments`: student, class, source; tạo enrollment và obligation nhất quán.
- `POST /invoices/{invoice_id}/payment-attempts`: bắt buộc `Idempotency-Key`; redirect không đánh dấu paid.
- `GET /invoices/{invoice_id}`: total, discounts, paid, balance, states và permission.

## Lesson authoring và media

### Lesson documents

- `POST /learning-contents`: tạo metadata và draft đầu tiên.
- `GET /learning-contents/{id}/documents/{version}`: trả block document đã lọc theo quyền.
- `PUT /learning-contents/{id}/draft`: body gồm `schema_version`, ordered blocks và optimistic `base_version`; server runtime-validate từng block.
- `POST /learning-contents/{id}/publish`: tạo immutable publication snapshot sau approval/accessibility/media-ready checks.
- `GET /lesson-block-definitions`: registry block type effective theo module/license và client capability.

Mỗi block có `id`, `type`, `schema_version`, `payload`, optional `locale` và accessibility metadata. Client không được gửi executable code.

### Media upload

- `POST /media/upload-sessions`: filename, declared MIME, size, checksum, purpose, owner context; trả multipart/tus handoff hoặc signed part URLs.
- `POST /media/upload-sessions/{id}/complete`: idempotent finalize; server xác minh parts/checksum và đưa asset vào scan/processing.
- `GET /media/assets/{id}`: metadata, scan/processing state, derivatives và authorized capabilities.
- `POST /media/assets/{id}/playback-token`: trả signed playback manifest/URL sau scope check.
- `POST /media/assets/{id}/retry-processing`: chỉ role vận hành có quyền; audit và không ghi đè source.

Upload state: initiated, uploading, uploaded, scanning, processing, ready, rejected, failed. Client không được coi upload thành công là media sẵn sàng phát.

### Playback/progress

- `PUT /learning-progress/{content_id}`: position, completion evidence, client sequence; idempotent và scope theo enrollment.
- Audio/video response hỗ trợ duration, caption/transcript references, playback speed và resume position.

## Assessment và practice

- `GET /question-type-definitions`: registry question type effective; không trả executable plugin.
- `GET /programs/{program_id}/competency-definitions`: competency groups, required state, rubric, score scale, normalization policy và version.
- `POST /assessment-blueprints`: subject/program, competency definitions, score scales, rubric references, normalization rules, placement thresholds, target outcomes và immutable version.
- `GET /program-competency/blueprints` và `GET /program-competency/blueprints/{blueprint_id}`: blueprint đã lọc theo subject/program scope.
- `POST /program-competency/blueprints`: tạo draft blueprint version kế tiếp; `POST /program-competency/blueprints/{blueprint_id}/publish` chỉ publish bản draft đã qua validation.
- `POST /question-bank/items`: type key, schema version, subject/program, competency group, prompt/media, answer schema, scoring config; runtime validation bắt buộc.
- `POST /assessments`: kind (entrance/mock/practice), subject/program, blueprint version, audience, window, attempts, scoring policy và result visibility.
- `POST /assessments/{id}/attempts`: unique business key, start/expiry/state.
- `PUT /assessment-attempts/{id}/answers/{item_id}`: answer payload, `save_sequence`, optional media response; request cũ không ghi đè sequence mới.
- `POST /assessment-attempts/{id}/submit`: idempotent; trả submission/result/manual-review state và competency evidence candidates theo blueprint.
- `POST /assessment-answers/{id}/manual-reviews`: rubric, score, feedback, optional timestamp annotations; audit.
- `GET /students/{student_id}/competency-profiles?program_id=&subject=&class_id=`: baseline/current/target, competency states, evidence summary, confidence và class context theo scope.
- `POST /competency-profiles/{profile_id}/reviews`: per-competency rubric results, evidence references, rationale, confidence và approval state.
- `GET /competency-profiles/{profile_id}/evidence`: raw score/scale, normalized score/level, source, reviewer, class/enrollment/session reference, assessed time và immutable versions.
- `GET /students/{student_id}/learning-output?enrollment_id=&program_id=&class_id=`: published schedule, materials, scores, attendance, feedback và competency summaries theo self/enrollment/program scope.
- `GET /parent/students/{student_id}/learning-output?enrollment_id=&program_id=&class_id=`: cùng nguồn canonical nhưng kiểm tra độc lập `view_schedule`, `view_progress`, `view_scores`, `view_attendance`, `view_feedback` và `view_competency`; nhóm không có quyền trả rỗng/null cùng visibility metadata.
- `POST /class-outputs/{id}/publish`: chỉ nhận output `confirmed` thuộc allowlist schedule/material/score/attendance/feedback/competency, yêu cầu quyền publish và class scope; idempotent theo organization/output, tạo immutable publication mapping, audit event và notification context link. Worklog, private note, internal handoff, grading queue và payroll luôn bị từ chối.
- `GET /notifications?context_type=class-output`: trả notification đã lọc theo người nhận với context `{ contextType, contextId, outputType, classId, enrollmentId }`; không chứa private payload. Khi mở context link, API đích phải kiểm tra lại organization, enrollment/delegation và quyền theo loại output.

Speaking upload phải dùng media upload session có purpose `assessment-response`, giới hạn duration/size và chỉ candidate/reviewer đúng scope truy cập.

## Parent, online class, HRM và finance

- `POST /students/{student_id}/parent-delegations`.
- `POST /conversations`, `POST /conversations/{id}/messages`.
- `POST /classes/{class_id}/online-sessions`; join/recording chỉ cấp sau enrollment/delegation check.
- `GET /students/{student_id}/learning-output?enrollment_id=&program_id=&class_id=`; chỉ self-scope và trả schedule/material/score/attendance/feedback/competency đã published.
- `POST /payroll-periods/{id}/calculate|approve`; locked period chỉ adjustment.
- `POST /finance/expense-requests`.

## Integration webhooks và workers

- `POST /integrations/{provider}/payment-webhooks`: signature, replay protection, inbox persistence, idempotent async processing.
- `POST /integrations/{provider}/meeting-webhooks`: attendance/recording events, signature và reconciliation.
- `AccountingSyncEvent`: stable event/idempotency key, organization/branch, entity, event type/version và payload.
- `MediaProcessingEvent`: asset id, organization, operation, source checksum, pipeline version, idempotency key.

## AI và super admin

- `POST /ai/tasks`, `POST /ai/tasks/{id}/review`: policy/minimization, model/prompt/source/confidence và high-risk review.
- `POST /super-admin/product-plans`, `POST /super-admin/licenses`, renew/revoke và `GET /runtime/license-state`.

## Contract invariants

- Không bypass organization/branch/student/media scope hoặc module entitlement.
- Không cấp URL private trước authorization; signed URL ngắn hạn và không thay access policy.
- Không publish lesson khi block schema không hợp lệ hoặc asset bắt buộc chưa ready.
- Không cho tenant upload/execute JavaScript lesson/question plugin.
- Không có attempt/submit/webhook/payment effect trùng.
- Kết quả assessment đã publish chỉ tạo hoặc cập nhật competency evidence theo đúng subject/program/blueprint; không được ghi đè baseline/current snapshot ngoài workflow phê duyệt.
- Không so sánh normalized score/level giữa hai blueprint hoặc policy không tương thích; regrade/correction phải tạo version/audit mới.
- Class-scoped competency view dùng cùng profile/evidence với global view và không được tạo bản sao theo lớp.
- Published class outputs phải xuất hiện ở student read model theo enrollment; parent read model phải kiểm tra delegation độc lập cho score, progress, attendance, feedback và competency summary.
- Draft, grading queue, worklog, payroll state, private note, internal handoff và reviewer-only rationale không được trả qua student/parent endpoints.
- Notification công bố class output chỉ chứa title/body công khai, recipient IDs và context link; không chứa reviewer rationale, worklog hoặc private payload. Mở context link phải kiểm tra authorization lại.
- Không dùng MCP làm dependency runtime cho lesson renderer, player, recorder, uploader hoặc assessment engine.
- Không tự chốt payment từ redirect, sửa payroll locked, hoặc áp dụng AI high-risk chưa review.
- Không cutover tenant nếu thiếu backup, final sync, validation, target license và rollback readiness.
