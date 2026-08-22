import type { Metadata } from "next";
import { StudentAssessmentWorkspace } from "./student-assessment-workspace";

export const metadata: Metadata = {
  title: "Bài kiểm tra",
  description: "Học viên làm bài kiểm tra và xem kết quả xếp lớp được công bố.",
};

export default function StudentAssessmentPage() {
  return <StudentAssessmentWorkspace />;
}
