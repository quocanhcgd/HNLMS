import { PageHeader } from "@/components/app-shell";
import { PageFrame } from "@/components/domain";
import { OrganizationModuleManager } from "./module-manager";

export default function OrganizationModulesPage() {
  return (
    <div className="page">
      <PageHeader title="Modules" subtitle="Control organization availability without changing license entitlements." />
      <PageFrame>
        <OrganizationModuleManager />
      </PageFrame>
    </div>
  );
}
