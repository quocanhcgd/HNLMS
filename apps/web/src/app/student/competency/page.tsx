import type { Metadata } from "next";
import { StudentEnglishWorkspace } from "../english/student-english-workspace";

export const metadata: Metadata = {
  title: "Hồ sơ năng lực",
  description: "Theo dõi năng lực đầu vào, hiện tại và mục tiêu theo từng môn học.",
};

export default function StudentCompetencyPage() {
  return <StudentEnglishWorkspace />;
}
