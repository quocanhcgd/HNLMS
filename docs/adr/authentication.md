# Authentication decision

- Tenant users authenticate with email/password initially; SSO is an extension through `external_identities`.
- Passwords use Node `crypto.scrypt` with random salt and versioned parameters; plaintext is never stored or logged.
- Sessions use opaque random tokens. Only SHA-256 token hashes are stored. The `hnlms_session` cookie is `HttpOnly`, `Path=/`, eight hours maximum age, `SameSite=Lax` in local/test and `SameSite=Strict; Secure` in production. Logout writes `revoked_at`; password change and security events revoke all subject sessions.
- Password reset tokens are opaque, hashed, single-use and 30 minutes by default. Responses do not reveal whether an email exists; token consumption is atomic and marks `used_at`.
- Account states invited/active/suspended/archived are enforced before session use.
- Platform administrators are isolated from tenant users in a separate table/realm and require MFA before any session is accepted. Tenant sessions always carry an organization; a platform session cannot be used as a tenant principal.
- SSO is an extension through `external_identities`; provider subject is unique and never replaces local realm checks.
- Account recovery requires a verified recovery channel, creates a reset token through the shared policy, forces password rotation, and revokes existing sessions.
- CSRF, cookie issuance, rate-limit and HTTP endpoint details are implemented in T166 and the auth policy in T167; this ADR defines the foundation used by T027.
