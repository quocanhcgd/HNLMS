# Business Operating Model

Last updated: 2026-08-30

This document is the source of truth for HN-LMS business flow ownership. Implementation must not add new routes, sidebar items or task paths that contradict this model.

## Workspace principle

A user may have many roles, but the UI must run in one active workspace at a time. Navigation is driven by workspace first, then license/module entitlement, role permissions and data scope.

- `/` public workspace for guests and prospective learners.
- `/platform` provider control plane for platform/license/tenant operators.
- `/admin` staff operations workspace for organization, branch and back-office users.
- `/teacher` teaching workspace for teachers and teaching assistants.
- `/student` learner self-service workspace.
- `/parent` parent/guardian self-service workspace.

`/admin` means staff operations, not a catch-all shell for every authenticated user.

## Department handoffs

| From             | To                        | Handoff artifact                                             | Owner after handoff          |
| ---------------- | ------------------------- | ------------------------------------------------------------ | ---------------------------- |
| Public/Marketing | Admission                 | Lead/consultation request                                    | Consultant/admission manager |
| Admission        | Assessment                | Entrance assessment assignment with subject/program blueprint | Assessment owner/consultant  |
| Admission        | Academic affairs          | Converted learner and enrollment request                     | Academic affairs             |
| Academic affairs | Finance                   | Confirmed enrollment/tuition obligation                      | Finance officer/accountant   |
| HRM              | Academic affairs          | Teacher profile, skill, certification and availability       | Academic scheduling          |
| Academic affairs | Teacher                   | Teaching assignment and class/session schedule               | Teacher                      |
| Teacher          | Academic affairs          | Attendance, score, session confirmation, competency evidence and learner risk signal | Academic affairs             |
| Academic affairs | Payroll                   | Confirmed session/worklog and substitutions                  | Payroll officer              |
| Payroll          | Finance                   | Approved payroll/payment batch                               | Finance/accountant           |
| Finance          | Student/Parent            | Invoice, payment request, receipt                            | Student/parent self-service  |
| Communication    | All workspaces            | Conversation/notification delivery                           | Audience-specific workspace  |
| Reporting        | Leadership/branch manager | Scoped KPI/read model/export                                 | Reporting owner              |

## Core operating streams

### Admission

Consultants work in `/admin/admission`. They own lead intake, consultation history, follow-up queue, assessment assignment and conversion. They do not own learning progress, payroll or unrelated finance details.

Admission managers use the same workspace with an organization-wide control scope. They own the admission pipeline rather than the consultant's conversation content: routing and reassigning leads, monitoring SLA and next actions, resolving unassigned/overdue work, reviewing duplicate or at-risk records, and approving or returning a complete handoff to academic affairs and finance. They may inspect the lead summary and audit state but must not edit private consultation notes on behalf of a consultant. Every assignment, status transition and handoff decision is an auditable workflow event; a returned handoff goes back to the responsible consultant with a required follow-up step.

In addition to the organization pipeline, an admission manager has the same self-service staff capabilities as a consultant for their own worklog, leave requests and published payslips/CRM income. The role also receives internal notifications and may participate in operational conversations with academic affairs, finance, HR and support. These personal records are isolated by the manager's own user identity; this does not grant access to payroll-period administration, HR records or another employee's private data.

The admission-manager staff workspace has an explicit five-part navigation contract: `Overview` (operational summary), `Admission` (pipeline, assignment, SLA and handoff), `Information` (internal conversations and received notification inbox), `Personal` (own schedule/worklog, leave requests and income/payslips), and `Settings` (own account/profile/preferences). The notification inbox is a received, role-scoped read model; broadcast composition and delivery administration remain separate operations for authorized communication owners. Internal conversations must support the admission handoff context and its participants (academic affairs, finance, HR, support and the responsible consultant) without exposing private consultation notes.

Assessment assignment starts from the learner's declared subject, program and goal. Admission selects or requests an `AssessmentBlueprint`; it must not assume an English four-skill test for every learner. The handoff to assessment includes the required competency groups, branch/program scope and intended placement decision.

### Assessment and competency evidence

Assessment owns assessment definitions, blueprint versions, attempts, manual review and publication of results. A published result creates a competency evidence record for the referenced student and subject/program; it does not silently overwrite the learner's profile or baseline. Academic affairs owns normalization, placement thresholds, pathway activation and the approval policy for baseline/current snapshots.

The same evidence contract is used for entrance, mock, classwork and teacher review. English may use listening, speaking, reading and writing, while Mathematics, Literature or future subjects define their own competency groups and rubrics. A missing competency is valid when it is outside the program blueprint; it is a data gap only when the blueprint requires it.

### Academic operations / Học vụ

Academic affairs work in `/admin/academic`. They own programs, classes, schedules, enrollments, student records as managed data, attendance review, progress monitoring, class transfer/hold/completion, teaching assignment and substitutions.

Academic affairs also owns program competency definitions, assessment blueprints, normalization policies, placement rules and pathway targets. The canonical competency profile belongs to `student + subject/program`; class views are scoped projections of that profile and must not create a second copy. When a learner changes class, the profile and evidence history remain intact while class references preserve context.

### Teacher capability and HRM

HR works in `/admin/hrm`. HR owns employee/teacher/assistant profiles, contracts, certifications, skills, availability, work schedule, leave, attendance and performance records. HR does not own class opening unless separately granted academic permission.

### Scheduling and teaching assignment

Scheduling is an academic operation using HRM capability data. Teacher assignment must check skill/certification, availability, branch eligibility, contract status, workload, room/online-session conflicts and leave/substitution policy.

### Payroll and teaching fees

Payroll is a cross-functional stream: HRM provides contracts/leave/attendance, academic affairs confirms teaching sessions, payroll calculates salary/teaching/assistant fees, finance disburses and reconciles. Payroll UI belongs to `/admin/payroll`; personal payslip/worklog self-service belongs to `/teacher/payroll` and `/teacher/worklogs`.

### Teacher lesson delivery

Before each assigned teaching session, the teacher prepares and publishes a session pack containing the lesson, in-class exercise, assessment/checkpoint, homework and reference materials. Each item has its own visibility and completion state but is delivered from the class session workspace. In-class exercises can be graded during the session; homework remains in a pending-review queue and is graded after the session. Teachers may attach private media/documents, but the student experience is an in-system viewer/player with signed access; downloading is not the default learning flow.

Teachers record competency observations only through the rubric and competency groups assigned to the class/program. A teacher review must identify each assessed group, evidence, confidence and rationale; a free-form note alone cannot update the canonical competency snapshot. From a class roster, teachers may open the shared learner competency profile with the class filter already applied.

Teaching assistants may grade assignments and record competency evidence only for classes and competency groups explicitly assigned to them. They may not access entrance/mock assessment queues or approve a baseline/current snapshot unless a separate assessment-review permission is granted. Teachers may access entrance/mock and profile review only for the subject/program, branch and class scope granted by academic affairs and their competency/certification policy.

### Cross-workspace propagation from class operations

The class workspace is the operational source for session context, but it is not a second student record. Every class action is classified as one of the following:

- **Published learning output**: confirmed schedule changes, published lesson/material, published score, attendance result, sent feedback and approved competency evidence. These update the student portal and the parent portal according to enrollment and delegation scope.
- **Internal operational state**: draft material, grading queue, worklog, payroll confirmation, internal handoff, private teacher note, draft rubric and unresolved risk signal. These remain in teacher/academic/payroll workspaces; a notification may be sent without exposing the private payload.
- **Sensitive evidence**: baseline/current/target and published feedback are visible to the student. Parent visibility follows independent delegation permissions. Internal confidence, reviewer rationale, draft evidence and audit details remain staff-only unless a policy explicitly exposes them.

Academic affairs owns the publication policy and read models that synchronize these outputs. Student and parent portals consume the same canonical records; they do not recalculate competency, scores or progress independently. Communication links may reference the class, session, assessment or evidence record and must enforce the same scope.

### Student self-service

Students use `/student`. They see only their own schedule, lesson packs, progress, scores, homework, library, assessments, online sessions, billing and messages. A published session pack is opened in the system: lesson/video/audio/PDF content is viewed or played inline, in-class exercises are submitted during class, and homework is submitted for later teacher review. Students do not need to download teaching materials to study.

Student self-service also includes the published competency profile for each subject/program: baseline, current level/score, target, progress, evidence summary and teacher feedback. Draft, pending-review, superseded and staff-only evidence is not shown as a confirmed result.

### Parent self-service

Parents use `/parent`. They see each linked student only according to active delegation permissions. Parent rights are per student, time-bounded and auditable.

Parent self-service may show the same published learning outputs as the student only when the delegation grants the corresponding progress, score, attendance or feedback permission. Competency profile access is not implied by merely being linked to a student.

### Finance

Finance staff work in `/admin/finance`. They own tuition policies, invoices, receivables, payments, refunds, receipts, reconciliation, accounting sync and finance reports. Student/parent payments are self-service routes, not admin routes.

### Branch management

Branch managers use `/admin` with branch-scoped dashboards and module groups. The `Vận hành cơ sở` hub is their starting point for coordinating admission, classes/sessions, student enrollment, teacher assignments, branch HR visibility, branch finance and scoped reports. Each destination preserves the manager's assigned branch filter and exposes only actions allowed by that department; cross-branch administration and organization-wide payroll remain unavailable. The role also receives internal notifications and uses the personal worklog, leave and published payslip routes for its own employment records.

## Forbidden implementation patterns

- Do not place student or parent self-service pages under `/admin`.
- Do not place teacher self-service pages under `/admin` unless the page is explicitly staff management of teachers.
- Do not show student/parent portal navigation inside admin sidebar.
- Do not allow one role-only sidebar to aggregate all routes for all roles.
- Do not use route location as authorization. Every sensitive action still needs permission and data-scope checks.
- Do not add future task paths under `/admin/student`, `/admin/parent` or `/admin/teacher` for self-service flows.

## Required gates for new routes

Every new UI route must declare:

1. Workspace prefix.
2. Primary persona.
3. Business owner department.
4. Allowed roles/permissions.
5. Data scope.
6. Whether it is staff-managed data or self-service data.
7. Tests proving the route does not appear in the wrong workspace navigation.

## Change intake and cross-role impact gate

Every user-originated request is a cross-module change candidate until analysis proves otherwise. The receiving team records the request, identifies the business owner and maps affected roles, workspaces, routes, entities, permissions, notifications, reports, integrations and historical data. The request must be reviewed with every affected owner before implementation; a role may be marked not affected only with an explicit reason.

The minimum review chain is:

`User request → change item → impact analysis → business-owner decision → spec/role/UI/test update → implementation → cross-role verification → release note`

### Completion and next-step gate

Every completed request, implementation item or workflow adjustment MUST end with a recorded handoff. The owner records:

- completion evidence and verification status;
- residual risks, open questions or deferred scope;
- the recommended next step, its owner and priority;
- the dependency or acceptance condition that starts that next step.

A work item is not considered fully closed until this handoff is recorded. If there is no immediate follow-up, record the reason and the condition that would reopen the work. The next-step proposal must also be reviewed across all affected roles when the completed change alters data, permissions, notifications, reports or another workspace.

Once the user or business owner has approved the scope and implementation direction, the team MUST proceed without requesting the same confirmation again. The team pauses only for a genuine blocker, a missing authority or a new decision that materially changes scope, risk or ownership; in those cases the blocker and the smallest required decision are recorded.

For table workflows, the default interaction is one primary table with a row-level `Thao tác` column. Repeated secondary tables are removed unless they represent a different owner or lifecycle. Edit opens a validated modal; delete uses confirmation and becomes archive/void/adjustment for immutable or published records. This rule applies across teacher, academic, admission, student, parent, finance and HR workspaces.
