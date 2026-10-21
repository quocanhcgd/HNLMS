# Architecture Map

```text
Browser roles
  -> apps/web (Next.js routes and role navigation)
  -> apps/api (NestJS modules and HTTP contracts)
  -> PostgreSQL / Redis / private object storage
  -> worker (async jobs, retries and provider adapters)

Shared packages
  domain-contracts    authorization       module-sdk
  integration-adapters license-contracts ui/theme-presets
```

Domain ownership stays in API modules. Web pages consume contracts and keep interaction state local. Workers own retryable or long-running work; they must not bypass authorization or audit boundaries. Cross-tenant and cross-branch access is rejected at the service boundary, not only hidden in the UI.
