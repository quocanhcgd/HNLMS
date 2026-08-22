import type { Metadata } from "next";
import { TeacherEnglishWorkspace } from "./teacher-english-workspace";

export const metadata: Metadata = { title: "Rà soát tiếng Anh", description: "Giáo viên rà soát tiến bộ bốn kỹ năng và ghi nhận nhận xét thủ công." };
export default function TeacherEnglishPage() { return <TeacherEnglishWorkspace />; }
