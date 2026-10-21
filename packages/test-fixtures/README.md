# Development Fixtures

`createDevelopmentSeed()` returns deterministic data for two isolated organizations, four branches and every supported persona. All identities use `example.test` addresses and stable IDs derived from `hnlms-development-v1`; no production credentials or personal data are included.

Use `seedDevelopmentData()` from the API seed adapter inside one database transaction. The adapter resets only rows carrying the same seed key, in child-to-parent order, then inserts parents before children. It is intended for development/test databases and must be disabled for production deployments.

The sample media asset is a non-personal SVG used to exercise branch-scoped object storage and malware scan state.
