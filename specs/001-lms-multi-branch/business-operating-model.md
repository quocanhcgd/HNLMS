# Business Operating Model

Last updated: 2026-08-22

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
| Admission        | Assessment                | Entrance assessment assignment                               | Assessment owner/consultant  |
| Admission        | Academic affairs          | Converted learner and enrollment request                     | Academic affairs             |
| Academic affairs | Finance                   | Confirmed enrollment/tuition obligation                      | Finance officer/accountant   |
| HRM              | Academic affairs          | Teacher profile, skill, certification and availability       | Academic scheduling          |
| Academic affairs | Teacher                   | Teaching assignment and class/session schedule               | Teacher                      |
| Teacher          | Academic affairs          | Attendance, score, session confirmation, learner risk signal | Academic affairs             |
| Academic affairs | Payroll                   | Confirmed session/worklog and substitutions                  | Payroll officer              |
| Payroll          | Finance                   | Approved payroll/payment batch                               | Finance/accountant           |
| Finance          | Student/Parent            | Invoice, payment request, receipt                            | Student/parent self-service  |
| Communication    | All workspaces            | Conversation/notification delivery                           | Audience-specific workspace  |
| Reporting        | Leadership/branch manager | Scoped KPI/read model/export                                 | Reporting owner              |

## Core operating streams

### Admission

Consultants work in `/admin/admission`. They own lead intake, consultation history, follow-up queue, assessment assignment and conversion. They do not own learning progress, payroll or unrelated finance details.

### Academic operations / Học vụ

Academic affairs work in `/admin/academic`. They own programs, classes, schedules, enrollments, student records as managed data, attendance review, progress monitoring, class transfer/hold/completion, teaching assignment and substitutions.

### Teacher capability and HRM

HR works in `/admin/hrm`. HR owns employee/teacher/assistant profiles, contracts, certifications, skills, availability, work schedule, leave, attendance and performance records. HR does not own class opening unless separately granted academic permission.

### Scheduling and teaching assignment

Scheduling is an academic operation using HRM capability data. Teacher assignment must check skill/certification, availability, branch eligibility, contract status, workload, room/online-session conflicts and leave/substitution policy.

### Payroll and teaching fees

Payroll is a cross-functional stream: HRM provides contracts/leave/attendance, academic affairs confirms teaching sessions, payroll calculates salary/teaching/assistant fees, finance disburses and reconciles. Payroll UI belongs to `/admin/payroll`; personal payslip/worklog self-service belongs to `/teacher/payroll` and `/teacher/worklogs`.

### Student self-service

Students use `/student`. They see only their own schedule, learning progress, scores, homework, library, assessments, online sessions, billing and messages.

### Parent self-service

Parents use `/parent`. They see each linked student only according to active delegation permissions. Parent rights are per student, time-bounded and auditable.

### Finance

Finance staff work in `/admin/finance`. They own tuition policies, invoices, receivables, payments, refunds, receipts, reconciliation, accounting sync and finance reports. Student/parent payments are self-service routes, not admin routes.

### Branch management

Branch managers use `/admin` with branch-scoped dashboards and module groups. They can coordinate admission, academic operations, branch finance, teacher/HR visibility and reports only inside granted branch scope.

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
