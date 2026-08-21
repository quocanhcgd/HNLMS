# Authentication decision

- Tenant users authenticate with email/password initially; SSO is an extension through `external_identities`.
- Passwords use Node `crypto.scrypt` with random salt and versioned parameters; plaintext is never stored or logged.
- Sessions use opaque random tokens. Only SHA-256 token hashes are stored. Session cookies will be HttpOnly, Secure and SameSite=Lax/Strict when HTTP handlers are implemented.
- Password reset tokens are opaque, hashed, single-use and time-limited.
- Account states invited/active/suspended/archived are enforced before session use.
- Platform administrators are isolated from tenant users in a separate table/realm and require MFA; MFA provider implementation remains an extension task.
- Session revocation is explicit with `revoked_at`; expiration and last-seen are tracked.
- CSRF, cookie issuance, rate-limit and HTTP endpoint details are finalized in T166/T167; this ADR defines the foundation used by T027.
