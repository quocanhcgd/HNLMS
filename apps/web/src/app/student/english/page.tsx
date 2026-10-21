import type { Metadata } from "next";
import { StudentEnglishWorkspace } from "./student-english-workspace";

export const metadata: Metadata = { title: "Hồ sơ năng lực", description: "Học viên theo dõi năng lực đầu vào, hiện tại và mục tiêu theo chương trình." };
export default function StudentEnglishPage() { return <StudentEnglishWorkspace />; }
