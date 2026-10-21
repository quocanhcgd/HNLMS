# AI Provider ADR

**Decision:** call an OpenAI-compatible provider only through the internal AI gateway. The gateway enforces consent, minimization, tenant/branch scope, policy checks, model allowlist and human review before high-impact persistence.

**Sandbox:** use a project with synthetic learner data and a low spend limit. Store API key and model endpoint reference in the secret manager. Redact names, contact data, private teacher notes, payroll and internal messages unless an approved task explicitly requires a field.

**Failure/fallback:** timeouts, policy blocks and provider errors become reviewable task states; manual teacher/admin review remains available. Do not expose prompts, raw provider output or hidden confidence signals to unauthorized roles.
