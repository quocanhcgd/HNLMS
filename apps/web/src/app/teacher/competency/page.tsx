import type { Metadata } from "next";
import { TeacherEnglishWorkspace } from "../english/teacher-english-workspace";

export const metadata: Metadata = {
  title: "Hồ sơ năng lực",
  description: "Giáo viên rà soát năng lực theo môn, chương trình và lớp được phân công.",
};

export default function TeacherCompetencyPage() {
  return <TeacherEnglishWorkspace />;
}
