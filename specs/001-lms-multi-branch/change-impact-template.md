# Change Impact Record

Use this record for every user-originated requirement, adjustment or workflow feedback before implementation.

## Request

- Change ID:
- Date/source/user:
- Request summary:
- Problem or expected outcome:
- Priority and deadline:
- Business owner:
- Decision/status: proposed | approved | rejected | deferred

## Impact matrix

| Area | Affected? | Impact / decision | Owner | Evidence or test |
|---|---|---|---|---|
| Admission/consultant | Yes/No |  |  |  |
| Academic affairs | Yes/No |  |  |  |
| Teacher | Yes/No |  |  |  |
| Teaching assistant | Yes/No |  |  |  |
| Student | Yes/No |  |  |  |
| Parent/delegation | Yes/No |  |  |  |
| Finance/payroll | Yes/No |  |  |  |
| HR | Yes/No |  |  |  |
| Communication/notification | Yes/No |  |  |  |
| Reporting/integration | Yes/No |  |  |  |

Also review affected workspace, route, module, entity, permission, data migration, historical records, notification, report, API contract and compatibility behavior. Every `No` must have a reason.

## UI normalization check

- Does the screen have a primary table and a secondary table showing the same rows or commands?
- If yes, consolidate into one table unless a different lifecycle/owner/permission is documented.
- Add row-level `Thao tác` commands allowed by state and permission.
- Edit opens a validated modal with dirty-state protection and audit.
- Delete uses confirmation; published/locked/audited data uses archive, void or adjustment.

## Approval and release

- Spec/acceptance scenarios updated:
- Role/workspace matrix updated:
- API/data model updated:
- UI screen specification/catalog updated:
- Tests added or updated:
- Migration/compatibility plan:
- Affected owners sign-off:
- Cross-role verification result:

## Completion handoff

- Completion evidence and verification status:
- Residual risks, open questions or deferred scope:
- Recommended next step:
- Next-step owner and priority:
- Dependency or acceptance condition to start next step:
- Reopen condition when no immediate next step exists:
- Approved scope/direction:
- Reconfirmation required: No, unless blocker, missing authority or material scope/risk/owner change
- Blocker or new decision requiring user input (if any):
