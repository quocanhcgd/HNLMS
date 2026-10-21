import type { Metadata } from "next";
import AdmissionRoleRouter from "./admission-role-router";

export const metadata: Metadata = {
  title: "Tuyển sinh",
  description: "Điều hành pipeline tuyển sinh, phân công tư vấn và bàn giao hồ sơ.",
};

export default function AdmissionPage() {
  return <AdmissionRoleRouter />;
}
