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

Use the shared checker for the same result on Windows, Linux and CI:

```powershell
./infra/development/check-services.ps1
./infra/development/check-services.ps1 -AllowDown -Json
```

PostgreSQL and Redis are required for API/integration work. Object storage is optional for UI-only work; set `ALLOW_DOWN=1` (or `-AllowDown`) when starting without it. The profile assumes native services or managed sandboxes, never committed credentials or Docker state. Sandbox adapters are payment, meeting, accounting, and AI; production provider credentials remain deployment secrets.

## Database migrations and competency seed

Create `F:\SPEC\HNLMS\.env` from `.env.example` and replace the local PostgreSQL values. The repository-level `.env` is gitignored and is loaded automatically by the API, migration, and development seed commands. Explicit variables already present in the process (CI/deployment) remain authoritative. Then run:

```powershell
Copy-Item .env.example .env
# edit .env and set DATABASE_URL using your local PostgreSQL connection values
```

Run:

```powershell
npm run db:migrate --workspace=@hnlms/api
npm run db:seed:competency --workspace=@hnlms/api
```

The competency seed is idempotent and development-only. Production never falls back to demo profiles and requires `DATABASE_URL` at startup.

To import legacy English skill records after migrations, call the tenant-scoped API with a user that has
`competency:migrate`. The importer resolves the latest active enrollment and joins its class, course, program,
and branch; records without a complete context are reported as failed and are never guessed:

```powershell
Invoke-RestMethod -Method Post http://localhost:4000/v1/competency-profiles/legacy-migration `
  -Headers @{ "x-user-id" = "<user-id>"; "x-organization-id" = "<organization-id>"; "x-permissions" = "competency:migrate" }
```

The importer is idempotent by `(organization_id, legacy_record_id)` and keeps source lineage in
`competency_evidence` and `legacy_english_migration_mappings`.

### Seed dữ liệu lớp học và nhân sự

Sau khi chạy migration, có thể tạo dữ liệu PostgreSQL phục vụ kiểm thử CRUD học vụ:

```powershell
npm run db:seed:academic --workspace=@hnlms/api
```

Seed tạo hoặc cập nhật phần còn thiếu theo mã ổn định: tổ chức demo Hà Nội, chi nhánh trung tâm,
khối đào tạo đa ngành, khóa Ngoại ngữ và Toán, lớp, lịch, giáo viên, trợ giảng, học viên, enrollment
và phân công. Lệnh có thể chạy lại an toàn, không xóa dữ liệu; dùng `ACADEMIC_SEED_KEY` để chọn namespace
ID khác. Script bị chặn khi `NODE_ENV=production`.

Để giao diện quản lý học vụ đọc đúng seed PostgreSQL, đặt thêm hai biến khi chạy web (lấy giá trị
`organizationId` và `branchId` từ output của lệnh seed):

```powershell
$env:NEXT_PUBLIC_DEMO_ORGANIZATION_ID = "<organizationId>"
$env:NEXT_PUBLIC_DEMO_BRANCH_ID = "<branchId>"
npm run dev:web
```
