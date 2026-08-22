import type { Metadata } from "next";
import { TeacherOnlineWorkspace } from "./teacher-online-workspace";
export const metadata: Metadata={title:"Lớp học online",description:"Giảng viên quản lý buổi học online."};
export default function TeacherOnlinePage(){return <TeacherOnlineWorkspace/>}
