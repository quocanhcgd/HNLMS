import type { Metadata } from "next";
import { TeacherAssessmentWorkspace } from "./teacher-assessment-workspace";

export const metadata: Metadata = {
  title: "Chấm bài & đề thi",
  description: "Giảng viên xem bài nộp, chấm câu tự luận/nói và khuyến nghị xếp lớp.",
};

export default function TeacherAssessmentPage() {
  return <TeacherAssessmentWorkspace />;
}
