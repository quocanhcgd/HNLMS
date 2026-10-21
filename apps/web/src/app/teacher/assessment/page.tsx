import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Chấm bài & đề thi",
  description: "Giảng viên xem bài nộp, chấm câu tự luận/nói và khuyến nghị xếp lớp.",
};

export default function TeacherAssessmentPage() {
  redirect("/teacher/assessment/entrance");
}
