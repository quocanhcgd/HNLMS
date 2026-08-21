# Remote Command Queue

Dashboard không chạy shell trực tiếp. Command queue chỉ mô tả yêu cầu đã whitelist; GitHub Issue/Actions hoặc remote agent là executor riêng.

## Allowed actions (Phase 1)

- `start_task`
- `run_quality`
- `generate_status`
- `request_input`

Không cho phép arbitrary shell, force push, production deploy, secret access hoặc destructive file operation.

## Workspace lock

Chỉ một command có `status=in_progress` được sở hữu workspace. Command mới phải queued khi lock đang giữ.
