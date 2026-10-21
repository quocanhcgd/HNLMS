# Current-State Audit: Change Impact and Cross-Role Workflow

**Audit date:** 2026-08-24  
**Change item:** CI-2026-08-24-001  
**Status:** Audited; implementation is planned, not yet approved for release

## Change item

| Field | Record |
|---|---|
| Source | User feedback during teacher-workspace review |
| Summary | Group teacher navigation; split teaching and internal communication; complete pay/worklog; split entrance and mock assessment; move row actions into the primary table; replace English-only competency review with a multi-subject competency profile; review class-detail propagation across roles; enforce change-impact and table/modal rules. |
| Expected outcome | One coherent workflow from consultation and assessment to class, evidence, student/parent views and reporting, without English-only assumptions or duplicate operational tables. |
| Business owner | Academic manager, with admission, HR/payroll and product-design sign-off |
| Decision | Approved for cross-role planning; implementation gates remain open until contract, authorization and propagation tests pass. |
| Compatibility | Keep /teacher/english while the generic competency route is delivered; migrate legacy English records without overwriting history. |

## Current-state audit matrix

Priority uses P0 for a workflow or authorization blocker, P1 for required MVP behavior and P2 for consistency or follow-up work.

| Area / screen | Current behavior | Related roles | Rule missing or violated | Impact | Priority | Recommended action | Task |
|---|---|---|---|---|---|---|---|
| Teacher navigation | Navigation is grouped into Tổng quan, Học tập, Thông tin and Cá nhân; competency is labelled Hồ sơ năng lực and /teacher/english remains the compatibility URL. | Teacher, assistant | Generic profile route and assistant visibility are not enforced by backend scope. | Wrong subject/program data could be exposed when the route is deep-linked. | P0 | Add route and API guards by branch, subject, program, class and certification; add assistant permission matrix tests. | T176, T178-T180 |
| Teacher communication | Trao đổi giảng dạy and Trao đổi nội bộ have separate modes and composer flows. | Teacher, parent, student, academic, support, finance | Threads are sample client state and newly created threads are not linked to a class, program, evidence or case. | Messages cannot reliably drive notifications, handoffs or audit reports. | P1 | Persist conversation context (classId, programId, learnerId, case/evidence reference), recipient scope and delivery/audit events. | T094, T097, T168 |
| Class detail shell | Class tabs now include Hồ sơ năng lực and filter the shared profile/evidence read model to the current class, with a link back to the global scoped table. | Teacher, assistant, academic, student, parent | Class identity still uses sample metadata and the class entry does not yet resolve persisted program/version assignment. | The class view no longer creates a second competency data source, but authoritative class/program persistence remains. | P0 | Persist class subject/program/blueprint assignment and add cross-module contract coverage for class → profile → student/parent output. | T094, T178 |
| Class students tab | A student table is accompanied by a separate Handoff cần xử lý panel. | Teacher, assistant, academic/support | Panel is an operational queue beside the table and its rows are not represented as row actions or linked cases. | Duplicate handling and unclear ownership; handoff state is not auditable per learner. | P1 | Keep only if it is a distinct academic case lifecycle; otherwise add Gửi học vụ / Mở trao đổi actions to the student row and open a modal. | T182-T184 |
| Class sessions/materials | Sessions table is followed by a materials table for the selected session. | Teacher, assistant, academic, student | This is a possible secondary table but the ownership/lifecycle distinction is undocumented. | Users may see repeated session commands and drafts can be confused with published material. | P1 | Document the exception as session-scoped materials with separate publication state, or consolidate into an expandable row/action drawer. | T182-T183 |
| Class assignments, attendance and scores | Several tables use page-level commands (Chấm bài, Công bố điểm, Chốt điểm danh) and many rows have no action column. | Teacher, assistant, student, parent, academic | Table rule requires row-level action and modal editing; published scores/attendance require immutable adjustment. | Bulk buttons do not identify the affected learner/record and can bypass audit context. | P0 | Add state-aware row actions, validated edit modal, confirmation and adjustment/version workflow; publish only confirmed records. | T183-T184, T097 |
| Entrance assessment | Separate route exists, table has an action column and modal review, but data is hard-coded to IELTS/TOEIC and does not show subject/program/blueprint version. | Consultant, teacher, assistant (permissioned), academic, student, parent | Assessment must be blueprint-driven and scoped; result must create immutable evidence, not overwrite a profile. | Multi-subject placement and historical baseline cannot be trusted. | P0 | Add subject, program, goal, blueprint version, skill groups, rubric, raw/normalized score, reviewer and evidence IDs; publish handoff event to admission/academic. | T090-T094, T178-T179 |
| Mock assessment | Separate route exists and shares the same review table/modal pattern; still English-specific and mixes automated/manual components. | Teacher, assistant (permissioned), student, parent, academic | Mock result and entrance result need distinct source semantics but a shared evidence contract. | Current profile may conflate practice results with placement baseline. | P0 | Use the same generic assessment contract with source=mock; map manual review by competency group and publish only approved result. | T090-T094, T098 |
| Hồ sơ năng lực route | Global teacher profile supports subject/program/class/competency/source/status/confidence/date filters; class detail has a scoped entry; student/parent receive published-only records. | Teacher, assistant (permissioned), student, parent, academic, reporting | Migration service now maps legacy English records into generic evidence/profile versions and `/teacher/english` redirects to `/teacher/competency`; repository persistence is still in-memory. | The profile can be reviewed globally or from a class without duplicating records; each migrated record keeps source/timestamp/reviewer lineage and an audit mapping. Cross-module contract now proves published-only portal propagation and scope isolation. | P0 | Replace in-memory migration/profile repositories with tenant database transaction + unique legacy mapping constraint; run staged backfill and rollback rehearsal. | T095, T166, T185 |
| Student assessment/progress/scores | Student assessment and portal screens contain IELTS/TOEIC examples; progress is a summary table and scores are a separate detail card. | Student, teacher, academic, parent | Student learning-output contract/service scopes by student + enrollment/program/class, uses an explicit public-field projection and returns only published schedule, materials, scores, attendance, feedback and competency summaries; production read repository and UI data wiring remain. | Negative tests prevent dynamically attached operational/private fields from leaking, but current screens still use sample data until the persisted adapter is wired. | P1 | Add tenant database read repository and connect student progress/schedule/scores screens to the canonical output. | T095, T097, T166 |
| Parent portal and delegation | Parent learning-output service reuses the canonical student output and applies independent `view_schedule`, `view_progress`, `view_scores`, `view_attendance`, `view_feedback` and `view_competency` checks per student; hidden groups return no records and explicit visibility metadata. | Parent, student, teacher, academic | Contract/service, negative tests and context-only publication notification are complete; production delegation resolver, tenant read repository and parent UI data wiring remain. | A single broad grant can no longer expose every output type, but sample UI data may still diverge until persisted adapters are connected. | P0 | Wire active/time-bounded delegation resolution and persisted output repository into the parent endpoint; reauthorize every opened notification context. | T096, T097, T166, T169 |
| Admission consultant flow | Consultation and conversion use modal workflows, but seed leads and class choices are English-centric; assessment handoff is only a text/timeline entry. | Consultant, academic, teacher, student, finance | Contract coverage now proves subject/program/branch/class context through entrance assignment, placement, enrollment and published profile output; production event/state persistence is still pending. | Consultant may route a learner to an incompatible assessment/class or admission and assessment state stores may diverge without a shared transaction/event. | P0 | Capture subject/program/goal and requested competency groups; persist an auditable assessment handoff event and reconcile lead state with assignment/result state. | T095, T166, T185 |
| Academic program/class setup | Academic program table now displays subject, competency-group count and blueprint version for English, Mathematics and Literature; API supports scoped draft creation and publish. | Academic manager, academic affairs, HR, teacher | The current admin table is read-oriented; editing blueprint definitions and class assignment constraints still need persisted UI workflows. | Program context is visible and reusable by downstream profiles, but edits still require the API contract/service boundary. | P0 | Add validated blueprint edit modal and persisted program/class assignment checks; preserve published versions as immutable. | T092, T178 |
| Teacher worklog and payroll | Lương & công dạy has period tabs, worklog table, detail modal and adjustment modal; values are local sample data. | Teacher, assistant, academic, payroll, HR, finance | No server source-of-truth or cross-module reconciliation is wired; row action is implicit on date rather than an explicit action column. | Payroll can diverge from attendance/schedule and adjustment status cannot propagate to payroll officers. | P1 | Persist worklog/attendance reconciliation, add explicit row action, lock/version adjustment workflow and scoped payroll read model. | T097, T183, T184 |
| Admin communication/notifications | Class-output publication creates a context-only notification for deduplicated recipients; admin communication UI still has sample tables without row actions. | Academic, support, branch manager, teacher, parent, student | Service policy blocks internal output types and private payloads, but notification/publication persistence is in-memory and is not yet atomic through outbox; opening the linked context is not wired to a production authorization resolver. | Publication intent is traceable without copying reviewer/worklog data, but a partial failure could notify before output persistence and a stale delegation must not grant context access. | P0 | Persist publication with unique organization/output constraint, enqueue notification through the same transaction/outbox, then authorize context reads and add delivery retry/audit actions. | T097, T166, T168, T169 |
| Reporting | Reporting is branch-level revenue, learner and payroll summary; no subject/program/competency dimensions. | Executive, branch manager, academic, finance, HR | Reports cannot reconcile baseline/current/target or compare programs without English assumptions. | Management cannot measure multi-disciplinary outcomes or trace a value to evidence. | P1 | Add program, subject, class, competency, source and time dimensions; expose freshness and source lineage. | T094, T098 |

## Role and propagation impact

Every role below is explicitly considered for this change. Yes means a workflow, permission, data contract or notification changes; No includes the reason for exclusion.

| Role | Affected? | Decision / required verification |
|---|---|---|
| Consultant / admission | Yes | Captures learner goal and program, assigns the correct blueprint assessment and receives placement feedback. |
| Academic affairs | Yes | Owns class/program context, handoff, publication and correction workflow. |
| Academic manager | Yes | Owns program versions, competency blueprints, rubrics, thresholds and teacher assignment policy. |
| Teacher | Yes | Reviews scoped entrance/mock work, captures rubric evidence and confirms published learning outputs. |
| Teaching assistant | Yes | Can grade/evidence only in assigned class/program groups; assessment review and baseline/current approval need explicit permission. |
| Student | Yes | Sees published schedule, scores, feedback and baseline/current/target competency for own enrollments. |
| Parent / delegation | Yes | Sees only published learner outputs allowed by independent delegation permissions. |
| Payroll / finance | Yes | Receives reconciled worklog adjustments; no competency detail is needed beyond the approved class/session reference. |
| HR | Yes | Supplies active contract, certification and branch eligibility used by teacher assignment and review scope. |
| Communication / notification | Yes | Publishes context-linked events and respects audience, delegation and retry policy. |
| Reporting / integrations | Yes | Reads canonical evidence and publication read models by subject/program/class/branch. |
| Platform/license administration | No for business semantics | Only module entitlement and tenant boundary apply; no new business fields unless a tenant lacks the assessment/communication module. |

### Published-output propagation

| Source event | Student | Delegated parent | Teacher/academic | Payroll/HR | Must remain internal |
|---|---|---|---|---|---|
| Published schedule/material | Yes | Yes when schedule/content permission exists | Yes | No | Draft version, authoring notes |
| Confirmed attendance | Yes | Yes when attendance permission exists | Yes | Yes for worklog reconciliation | Private staff note |
| Published score/feedback | Yes | Yes when score/feedback permission exists | Yes | No | Draft grade, internal rubric comment |
| Confirmed competency evidence | Yes | Yes when progress/score/feedback permission exists | Yes | No | Raw reviewer confidence or internal moderation note unless policy allows |
| Worklog/payroll/adjustment | No | No | Scoped staff only | Yes | Payroll calculation details outside own-payslip scope |
| Handoff/internal conversation | No | No | Assigned staff only | Only when finance/payroll case is addressed | Internal case notes and reviewer queue |

## Approved implementation sequence

1. **Contract and authorization:** finalize generic subject/program/blueprint/evidence fields, scope checks and publication policy; add cross-role contract tests.
2. **Academic and admission source:** configure English, Mathematics and Literature blueprints; capture learner goal; link consultant handoff to the selected blueprint.
3. **Teacher workflow:** keep the two assessment routes, replace English-only fields, add generic competency profile and class-scoped entry point, then normalize row actions/modal/confirmation behavior.
4. **Portal read models:** expose published learning outputs and competency summaries to student and delegated parent views with negative leakage tests.
5. **Payroll/communication/reporting:** reconcile worklog adjustments, context-link conversations/notifications and add multi-subject reporting dimensions.
6. **Migration and release gate:** migrate legacy English records, retain compatibility URL, run mixed-subject/multi-class/class-transfer/permission/mobile tests and record owner sign-off.

## Release gates

- No assessment or profile API accepts a subject/program-less write.
- Entrance, mock, class evidence and published portal views use the same evidence ID and blueprint version.
- A learner can have multiple programs/classes without profile overwrite or cross-class leakage.
- Every authenticated list screen has either a documented distinct secondary lifecycle or one primary table with a permission-aware Thao tác column.
- Edit is modal-validated; immutable/published records use confirmation plus archive/void/adjustment and audit history.
- Student and parent APIs never return drafts, worklog, internal queues or private rubric data.
- The audit record, affected-role decisions, migration plan and test evidence are linked from the release note.
- Every completed change records verification evidence, residual risks and a recommended next step with owner, priority and start condition, or an explicit condition for reopening the work.
