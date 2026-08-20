# HN-LMS development services

Production does not use Docker. Local development requires PostgreSQL, Redis and an S3-compatible object store. Use managed/local native services and set values from `.env.example`.

Required checks:

```powershell
node --version
npm --version
Test-NetConnection localhost -Port 5432
Test-NetConnection localhost -Port 6379
Test-NetConnection localhost -Port 9000
```
