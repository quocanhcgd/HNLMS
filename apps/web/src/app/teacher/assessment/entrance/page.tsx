import type { Metadata } from "next";
import { TeacherAssessmentWorkspace } from "../teacher-assessment-workspace";

export const metadata: Metadata = {
  title: "Chấm bài kiểm tra đầu vào",
  description: "Giáo viên chấm bài đầu vào được bộ phận tư vấn chuyển đến và đề xuất xếp lớp.",
};

export default function TeacherEntranceAssessmentPage() {
  return <TeacherAssessmentWorkspace mode="entrance" />;
}
