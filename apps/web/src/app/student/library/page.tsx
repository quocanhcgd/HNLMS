import type { Metadata } from "next";
import { StudentLibraryWorkspace } from "./student-library-workspace";

export const metadata: Metadata = {
  title: "Thư viện học tập",
  description: "Học viên tìm kiếm, lưu và mở học liệu được cấp quyền.",
};

export default function StudentLibraryPage() {
  return <StudentLibraryWorkspace />;
}
