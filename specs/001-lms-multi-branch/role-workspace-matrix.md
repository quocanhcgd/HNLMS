# Role Workspace Matrix

Last updated: 2026-08-22

## Workspace prefixes

| Workspace        | Prefix      | Purpose                                                         |
| ---------------- | ----------- | --------------------------------------------------------------- |
| Public           | `/`         | Public landing, catalog, consultation and invited public flows  |
| Platform         | `/platform` | Provider/license/tenant operations                              |
| Admin operations | `/admin`    | Staff operations for organization, branch and back-office roles |
| Teacher          | `/teacher`  | Teacher/assistant self-service and teaching work                |
| Student          | `/student`  | Learner self-service                                            |
| Parent           | `/parent`   | Parent/guardian self-service by delegated student               |

## Persona matrix

| Role/persona               | Default workspace | Allowed route prefixes                                                     | Main data scope                            | Primary functions                                                                          | Explicitly forbidden                                                        |
| -------------------------- | ----------------- | -------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Guest/prospect             | Public            | `/`, `/consultation`, public assessment invite                             | Public published data/token invite         | Browse, request consultation, take invited placement test                                  | Any admin/teacher/student/parent/platform route                             |
| Platform super admin       | Platform          | `/platform`                                                                | Platform tenants/licenses                  | Tenant/license/module/deployment operations                                                | Tenant business data without audited support context                        |
| Organization admin         | Admin             | `/admin`                                                                   | Organization                               | Settings, modules, branches, access, global operations                                     | Platform-only operations                                                    |
| Branch manager             | Admin             | `/admin`                                                                   | Granted branches                           | Branch dashboard, admission/academic/finance/HR/reporting oversight                        | Other branch detail, platform, personal portal impersonation                |
| Consultant                 | Admin             | `/admin/admission`, `/admin/leads`                                         | Assigned leads/branch leads                | Lead care, consultation, assessment assignment, conversion                                 | Payroll, HR confidential data, unrelated student learning records           |
| Academic affairs / Học vụ  | Admin             | `/admin/academic`, `/admin/communication`                                  | Branch/class/student scope                 | Classes, schedules, enrollments, attendance review, progress, substitutions                | Payroll calculation, HR contract edits, finance transactions unless granted |
| Academic manager           | Admin             | `/admin/academic`, `/admin/learning`, `/admin/reporting`                   | Academic departments/programs/branches     | Programs, courses, class opening, teaching assignment approval                             | Personal student/parent portal routes                                       |
| Marketing/content manager  | Admin             | `/admin/marketing`                                                         | Organization/branch content scope          | Landing content, preview, publication                                                      | Student private learning/finance/HR data                                    |
| Finance officer/accountant | Admin             | `/admin/finance`                                                           | Finance scope/branch/cost center           | Invoices, receivables, payments, refunds, accounting sync                                  | Learning details, HR skills/contracts outside payment needs                 |
| Payroll officer            | Admin             | `/admin/payroll`, selected `/admin/hrm`, `/admin/finance/payroll-payments` | Payroll period/cost center/branch          | Calculate/approve/lock payroll, payslips, teaching/assistant fees                          | Student portal and unrelated academic edits                                 |
| HR officer                 | Admin             | `/admin/hrm`                                                               | Employee/teacher/branch HR scope           | Employees, teachers, assistants, contracts, certifications, leave, attendance, performance | Class opening and finance disbursement unless separately granted            |
| Teacher                    | Teacher           | `/teacher`                                                                 | Assigned classes/self                      | Schedule, classes, attendance, content, grading, reviews, worklogs, own leave/payroll      | Admin staff operations, other teacher payroll, unrelated classes            |
| Teaching assistant         | Teacher           | `/teacher`                                                                 | Assigned sessions/self                     | Support sessions, worklogs, own schedule/leave/payroll                                     | Main-teacher-only grading/content unless granted                            |
| Student                    | Student           | `/student`                                                                 | Self enrollments                           | Schedule, progress, scores, homework, library, assessment, online, billing, messages       | Admin, teacher, parent management, other students                           |
| Parent/guardian            | Parent            | `/parent`                                                                  | Delegated students and granted permissions | Schedule/progress/scores/attendance/tuition/homework/conversations/notifications           | Admin, non-delegated student data, teacher workspace                        |
| Executive/reporting        | Admin             | `/admin/reporting`, `/admin`                                               | Granted org/branch/report scope            | KPI, reports, export, monitoring                                                           | Operational edits unless granted                                            |
| Support staff              | Admin             | `/admin/work`, selected modules                                            | Assigned cases/scope                       | Case queue, support triage, audited assistance                                             | Unscoped exports or impersonation                                           |

## Workspace navigation rules

- Admin navigation contains staff operation groups only: organization/access/settings, marketing, admission, academic, learning administration, communication administration, finance, payroll, HRM and reporting.
- Teacher navigation contains teaching self-service only.
- Student navigation contains learner self-service only.
- Parent navigation contains guardian self-service only.
- Platform navigation remains separate from tenant business workspaces.

## Sensitive payroll rules

| Persona            | Own payslip           | Payroll details by employee | Payroll summary | Calculate        | Approve                     | Pay/disburse     |
| ------------------ | --------------------- | --------------------------- | --------------- | ---------------- | --------------------------- | ---------------- |
| Teacher/assistant  | Yes                   | No                          | No              | No               | No                          | No               |
| HR officer         | Conditional           | Limited                     | Limited         | No               | Conditional                 | No               |
| Payroll officer    | Yes                   | Yes                         | Yes             | Yes              | Prepare/conditional         | No               |
| Branch manager     | No or masked          | Limited branch              | Branch summary  | No               | Conditional branch approval | No               |
| Finance accountant | Payment-needed fields | Payment-needed fields       | Payment batch   | No               | No                          | Yes              |
| Organization admin | Permission-based      | Permission-based            | Yes             | Permission-based | Permission-based            | Permission-based |

## Scheduling and teacher assignment rules

Teacher assignment belongs to academic scheduling but must use HRM capability data. A valid assignment checks:

- program/course skill match;
- certification requirement;
- teacher/assistant active contract;
- branch eligibility;
- availability and leave;
- class/session/time-slot conflict;
- workload policy;
- room or online-session conflict;
- substitution/approval policy.
