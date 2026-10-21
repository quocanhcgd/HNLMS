# Full-Stack Readiness Gate

The source checklist is `specs/001-lms-multi-branch/checklists/full-stack-readiness.md`. Checkbox state is evidence state, not a forecast. An item is checked only when the referenced artifact, test, runbook or rehearsal exists and has a recorded owner.

Run the implementation gate during normal development:

```powershell
npm run readiness:check
```

Run the production gate before accepting production data or traffic:

```powershell
npm run readiness:production
```

The production gate includes `Critical Before Implementation`, `Critical Before Production Data` and `Product Release Gates`. It prints machine-readable JSON and exits non-zero when any selected item is unchecked. CI may run the implementation gate; release automation must run the production gate and attach its JSON output to the change record.

An exception requires a documented risk owner, expiry date, compensating control and business/security approval. Exceptions never silently change a checkbox and cannot waive tenant isolation, credential handling, backup/restore evidence or legal/privacy obligations.
