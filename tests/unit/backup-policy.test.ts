import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

describe('backup and recovery policy', () => {
  it('documents encryption, recovery targets and quarantine controls', () => {
    const policy = readFileSync(resolve(root, 'infra/backup/README.md'), 'utf8');
    expect(policy).toContain('external KMS');
    expect(policy).toContain('RPO 24 hours');
    expect(policy).toContain('RTO 4 hours');
    expect(policy).toContain('quarantine');
    expect(policy).toContain('legal hold');
  });

  it('requires encryption and checksum generation in the backup script', () => {
    const script = readFileSync(resolve(root, 'infra/release-scripts/backup.sh'), 'utf8');
    expect(script).toContain('HN_LMS_BACKUP_ENCRYPT_COMMAND');
    expect(script).toContain('sha256sum');
    expect(script).toContain('trap cleanup EXIT');
  });
});
