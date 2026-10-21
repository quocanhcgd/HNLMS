import { TeacherPayrollWorkspace } from "./teacher-payroll-workspace";

export const metadata = {
  title: "Lương & công dạy",
  description: "Xem công dạy, phiếu lương và yêu cầu điều chỉnh của giáo viên.",
};

export default function TeacherPayrollPage() {
  return <TeacherPayrollWorkspace />;
}
