import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("native deployment skeleton", () => {
  it("defines hardened systemd services", () => {
    for (const service of ["web", "api", "worker"]) {
      const unit = read(`infra/systemd/hn-lms-${service}.service`);
      expect(unit).toContain("User=hnlms");
      expect(unit).toContain("NoNewPrivileges=true");
      expect(unit).toContain("ProtectSystem=strict");
      expect(unit).toContain("EnvironmentFile=/etc/hn-lms/hn-lms.env");
    }
  });

  it("routes health, API and web traffic separately", () => {
    const nginx = read("infra/nginx/hn-lms.conf");
    expect(nginx).toContain("location = /healthz");
    expect(nginx).toContain("location /api/");
    expect(nginx).toContain("proxy_pass http://hn_lms_web");
  });

  it("keeps release scripts strict and path-guarded", () => {
    for (const script of ["preflight", "install-release", "activate", "health-check", "rollback"]) {
      expect(read(`infra/release-scripts/${script}.sh`)).toContain("set -euo pipefail");
    }
    expect(read("infra/release-scripts/install-release.sh")).toContain("/opt/hn-lms/releases");
    expect(read("infra/release-scripts/rollback.sh")).toContain("Unsafe previous release");
  });

  it("uses placeholders instead of committed production secrets", () => {
    const environment = read("infra/environments/production.env.example");
    expect(environment).toContain("REPLACE_SECRET");
    expect(environment).not.toMatch(/SESSION_SECRET=[A-Za-z0-9+/]{32,}/);
  });
});
