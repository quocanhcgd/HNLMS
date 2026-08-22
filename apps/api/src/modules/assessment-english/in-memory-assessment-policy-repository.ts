
import type {
  AssessmentBankReference,
  AssessmentPolicyReference,
  AssessmentPolicyRepository,
  AssessmentQuestionReference,
} from "./assessment-policy.service";

export class InMemoryAssessmentPolicyRepository implements AssessmentPolicyRepository {
  readonly banks: AssessmentBankReference[] = [];
  readonly questions: AssessmentQuestionReference[] = [];
  readonly questionVersionCounts = new Map<string, number>();
  readonly assessments: AssessmentPolicyReference[] = [];

  async findQuestion(input: { organizationId: string; questionId: string }) {
    const question = this.questions.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.questionId,
    );
    return question ? structuredClone(question) : null;
  }

  async countQuestionVersions(input: { organizationId: string; questionId: string }) {
    return this.questionVersionCounts.get(`${input.organizationId}:${input.questionId}`) ?? 0;
  }

  async approveQuestion(input: {
    organizationId: string;
    questionId: string;
    approvedByUserId: string;
    approvedAt: Date;
  }) {
    const index = this.questions.findIndex(
      (question) => question.organizationId === input.organizationId && question.id === input.questionId,
    );
    if (index < 0) throw new Error("question_not_found");
    const approved: AssessmentQuestionReference = {
      ...this.questions[index]!,
      status: "approved",
      approvedByUserId: input.approvedByUserId,
      approvedAt: input.approvedAt,
    };
    this.questions[index] = approved;
    return structuredClone(approved);
  }

  async findAssessment(input: { organizationId: string; assessmentId: string }) {
    const assessment = this.assessments.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.assessmentId,
    );
    return assessment ? structuredClone(assessment) : null;
  }

  async findBank(input: { organizationId: string; bankId: string }) {
    const bank = this.banks.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.bankId,
    );
    return bank ? structuredClone(bank) : null;
  }

  async countApprovedQuestions(input: {
    organizationId: string;
    bankId: string;
    skill: string;
    type?: AssessmentQuestionReference["type"];
    level?: string;
  }) {
    return this.questions.filter(
      (question) =>
        question.organizationId === input.organizationId &&
        question.bankId === input.bankId &&
        question.status === "approved" &&
        question.skill === input.skill &&
        (!input.type || question.type === input.type) &&
        (!input.level || question.level === input.level),
    ).length;
  }

  async publishAssessment(input: { organizationId: string; assessmentId: string; publishedAt: Date }) {
    const index = this.assessments.findIndex(
      (assessment) => assessment.organizationId === input.organizationId && assessment.id === input.assessmentId,
    );
    if (index < 0) throw new Error("assessment_not_found");
    const published: AssessmentPolicyReference = {
      ...this.assessments[index]!,
      status: "published",
    };
    this.assessments[index] = published;
    return structuredClone(published);
  }
}
