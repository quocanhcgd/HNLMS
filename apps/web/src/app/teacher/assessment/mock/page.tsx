import type { Metadata } from "next";
import { TeacherAssessmentWorkspace } from "../teacher-assessment-workspace";

export const metadata: Metadata = {
  title: "Chấm bài thi thử",
  description: "Giáo viên chấm bài thi thử, xem điểm kỹ năng và công bố kết quả cho học viên.",
};

export default function TeacherMockAssessmentPage() {
  return <TeacherAssessmentWorkspace mode="mock" />;
}
