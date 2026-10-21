import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";

export const competencyProfiles: CompetencyProfileReadModel[] = [
  {
    profileId: "profile-en-speaking", organizationId: "org-1", studentId: "student-minh-anh", studentName: "Nguyễn Minh Anh",
    subjectId: "english", subjectName: "Tiếng Anh", programId: "teen-b1", programName: "Teen B1",
    classId: "en-2609", className: "EN-2609", branchId: "hn", competencyCode: "speaking-pronunciation",
    competencyName: "Nói · phát âm", baseline: { label: "A1", normalizedScore: 35 }, current: { label: "A2", normalizedScore: 58 },
    target: { label: "B1", normalizedScore: 70 }, evidence: { sourceType: "teacher_review", sourceId: "review-1", sourceLabel: "Đánh giá trên lớp", assessedAt: "2026-08-22T08:00:00.000Z", summary: "Bài nói Unit 4" },
    confidence: 78, publicationStatus: "published", reviewStatus: "confirmed", teacherFeedback: "Diễn đạt đủ ý; cần luyện độ trôi chảy và âm cuối.", version: 2,
  },
  {
    profileId: "profile-en-listening", organizationId: "org-1", studentId: "student-minh-anh", studentName: "Nguyễn Minh Anh",
    subjectId: "english", subjectName: "Tiếng Anh", programId: "teen-b1", programName: "Teen B1",
    classId: "en-2609", className: "EN-2609", branchId: "hn", competencyCode: "listening-main-idea", competencyName: "Nghe · ý chính",
    baseline: { label: "A2", normalizedScore: 48 }, current: { label: "A2+", normalizedScore: 64 }, target: { label: "B1", normalizedScore: 70 },
    evidence: { sourceType: "mock", sourceId: "mock-18", sourceLabel: "Thi thử", assessedAt: "2026-08-20T08:00:00.000Z", summary: "Mock test tháng 8" },
    confidence: 86, publicationStatus: "published", reviewStatus: "confirmed", teacherFeedback: "Đã nắm ý chính, cần tăng độ chính xác ở thông tin chi tiết.", version: 3,
  },
  {
    profileId: "profile-math-algebra-minh-anh", organizationId: "org-1", studentId: "student-minh-anh", studentName: "Nguyễn Minh Anh",
    subjectId: "math", subjectName: "Toán", programId: "math-foundation", programName: "Nền tảng THCS",
    classId: "math-2609", className: "MATH-2609", branchId: "hn", competencyCode: "algebra", competencyName: "Đại số",
    baseline: { label: "Trung bình", normalizedScore: 54 }, current: { label: "Khá", normalizedScore: 72 }, target: { label: "Giỏi", normalizedScore: 85 },
    evidence: { sourceType: "classwork", sourceId: "classwork-minh-anh-01", sourceLabel: "Đánh giá trên lớp", assessedAt: "2026-08-21T08:00:00.000Z", summary: "Bài luyện tập phương trình" },
    confidence: 81, publicationStatus: "published", reviewStatus: "confirmed", teacherFeedback: "Nắm chắc phương pháp; cần trình bày bước biến đổi nhất quán.", version: 1,
  },
  {
    profileId: "profile-literature-reading-minh-anh", organizationId: "org-1", studentId: "student-minh-anh", studentName: "Nguyễn Minh Anh",
    subjectId: "literature", subjectName: "Ngữ văn", programId: "literature-grade-10", programName: "Luyện thi 10",
    classId: "lit-2609", className: "LIT-2609", branchId: "hn", competencyCode: "reading-comprehension", competencyName: "Đọc hiểu",
    baseline: { label: "Trung bình", normalizedScore: 58 }, current: { label: "Khá", normalizedScore: 74 }, target: { label: "Giỏi", normalizedScore: 88 },
    evidence: { sourceType: "practice", sourceId: "practice-minh-anh-01", sourceLabel: "Bài kiểm tra", assessedAt: "2026-08-19T08:00:00.000Z", summary: "Đọc hiểu văn bản nghị luận" },
    confidence: 79, publicationStatus: "published", reviewStatus: "confirmed", teacherFeedback: "Lập luận rõ; cần chọn dẫn chứng sát hơn với yêu cầu câu hỏi.", version: 1,
  },
  {
    profileId: "profile-math-algebra", organizationId: "org-1", studentId: "student-gia-huy", studentName: "Trần Gia Huy",
    subjectId: "math", subjectName: "Toán", programId: "math-foundation", programName: "Nền tảng THCS", classId: "math-2608", className: "MATH-2608", branchId: "hn", competencyCode: "algebra", competencyName: "Đại số",
    baseline: { label: "Chưa đánh giá" }, current: { label: "Đạt", normalizedScore: 62 }, target: { label: "Khá", normalizedScore: 75 },
    evidence: { sourceType: "classwork", sourceId: "classwork-22", sourceLabel: "Đánh giá trên lớp", assessedAt: "2026-08-21T08:00:00.000Z", summary: "Bài luyện tập phương trình" },
    confidence: 62, publicationStatus: "draft", reviewStatus: "needs_support", version: 1,
  },
  {
    profileId: "profile-literature-reading", organizationId: "org-1", studentId: "student-phuong-linh", studentName: "Lê Phương Linh",
    subjectId: "literature", subjectName: "Ngữ văn", programId: "literature-grade-10", programName: "Luyện thi 10", classId: "lit-2609", className: "LIT-2609", branchId: "hn", competencyCode: "reading-comprehension", competencyName: "Đọc hiểu",
    baseline: { label: "Trung bình", normalizedScore: 52 }, current: { label: "Khá", normalizedScore: 76 }, target: { label: "Giỏi", normalizedScore: 88 },
    evidence: { sourceType: "practice", sourceId: "practice-31", sourceLabel: "Bài kiểm tra", assessedAt: "2026-08-19T08:00:00.000Z", summary: "Đọc hiểu văn bản nghị luận" },
    confidence: 88, publicationStatus: "published", reviewStatus: "confirmed", teacherFeedback: "Lập luận rõ, cần dẫn chứng sát hơn với câu hỏi.", version: 4,
  },
];

export function listStaffCompetencyProfiles(): CompetencyProfileReadModel[] {
  return structuredClone(competencyProfiles);
}

export function listStudentCompetencyProfiles(studentId: string): CompetencyProfileReadModel[] {
  return structuredClone(competencyProfiles.filter((row) => row.studentId === studentId && row.publicationStatus === "published"));
}

export function listParentCompetencyProfiles(studentId: string, permissions: ReadonlySet<string>): CompetencyProfileReadModel[] {
  if (!permissions.has("view_competency")) return [];
  return listStudentCompetencyProfiles(studentId);
}
