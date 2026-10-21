# Payment Provider ADR

**Decision:** use VNPay for Vietnam payment flows through an internal payment adapter. Keep invoice/payment/refund state in HN-LMS; provider responses are evidence, not the source of authorization.

**Sandbox:** use the VNPay test merchant, synthetic invoices and documented test cards only. Store `VNPAY_TMN_CODE`, hash secret and return/webhook configuration in the secret manager. Verify checksum, amount, currency, order and tenant before marking a payment paid. Use the existing organization-scoped idempotency key and inbox event identity.

**Failure/fallback:** retry provider queries with bounded backoff; duplicate callbacks are no-ops. A timeout or unavailable provider leaves payment pending and exposes manual bank-transfer reconciliation, never a client-side success claim.
