"use client";

import { useEffect, useState } from "react";
import { readDemoSession, type DemoRole } from "@/lib/demo-auth";
import AdmissionManagerWorkspace from "./admission-manager-workspace";
import { ConsultantPortal } from "./consultant-portal";

export default function AdmissionRoleRouter() {
  const [role, setRole] = useState<DemoRole | null>(null);
  useEffect(() => {
    setRole(readDemoSession()?.role ?? null);
  }, []);
  return role === "admission_manager" || role === "branch_manager" ? <AdmissionManagerWorkspace /> : <ConsultantPortal />;
}
