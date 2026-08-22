import type { Metadata } from "next";
import { TeacherContentWorkspace } from "./teacher-content-workspace";

export const metadata: Metadata = {
  title: "Soạn học liệu",
  description: "Giảng viên tạo, gửi duyệt và quản lý phiên bản học liệu.",
};

export default function TeacherContentPage() {
  return <TeacherContentWorkspace />;
}
