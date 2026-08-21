import type { Metadata } from "next";
import { ConsultantPortal } from "./consultant-portal";

export const metadata: Metadata = {
  title: "Không gian tư vấn tuyển sinh",
  description: "Quản lý lịch sử chăm sóc, bước tiếp theo và chuyển đổi ghi danh.",
};

export default function AdmissionPage() {
  return <ConsultantPortal />;
}
