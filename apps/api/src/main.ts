import "reflect-metadata";
import "./database/load-env";
import { readServerEnv } from "@hnlms/config";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CompetencyProfileController } from "./modules/assessment-english/competency-profile.controller";
import { ProgramCompetencyController } from "./modules/assessment-english/program-competency.controller";
import { StudentLearningOutputController } from "./modules/academic-learning/student-learning-output.controller";
import { ConsultantSelfServiceController } from "./modules/consultant-self-service/consultant-self-service.controller";
import { TeacherCommunicationController } from "./modules/communication/teacher-communication.controller";
import { TeacherOnlineController } from "./modules/online-class/teacher-online.controller";
import { ReportingController } from "./modules/reporting/reporting.controller";
import { AcademicRegistryController } from "./modules/academic-learning/academic-registry.controller";
import { BranchFinanceController } from "./modules/payroll-finance/branch-finance.controller";
import { HrmController } from "./modules/hrm-teacher/hrm.controller";
import { PayrollController } from "./modules/payroll-finance/payroll.controller";
import { BillingController } from "./modules/payroll-finance/billing.controller";
import { TeacherClassOperationsController } from "./modules/academic-learning/teacher-class-operations.controller";
import { TeacherLearningContentController } from "./modules/academic-learning/teacher-learning-content.controller";
import { TeacherLearningAssignmentController } from "./modules/academic-learning/teacher-learning-assignment.controller";
import { applySecurityHeaders, assertRequestSize, FixedWindowRateLimiter, isCsrfSafeRequest } from "./shared/http/security";
import { buildOpenApiDocument } from "./shared/http/openapi";
@Controller()
class HealthController {
  @Get("/health") health() {
    return { status: "ok", service: "api", version: "0.1.0", storage: process.env.DATABASE_URL ? "database_configured" : "demo_memory" };
  }
}
@Controller("openapi.json")
class OpenApiController {
  @Get() document() { return buildOpenApiDocument({ title: "HN-LMS API", version: "0.1.0", description: "Versioned HN-LMS HTTP contract", routes: [] }); }
}
@Module({ controllers: [HealthController, OpenApiController, CompetencyProfileController, ProgramCompetencyController, StudentLearningOutputController, TeacherLearningContentController, TeacherLearningAssignmentController, ConsultantSelfServiceController, TeacherCommunicationController, TeacherClassOperationsController, TeacherOnlineController, ReportingController, AcademicRegistryController, BranchFinanceController, HrmController, PayrollController, BillingController] })
class AppModule {}
async function bootstrap() {
  const env = readServerEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  const rateLimiter = new FixedWindowRateLimiter(120, 60_000);
  app.use((_request: { method?: string; headers?: Record<string, string | string[]>; ip?: string }, response: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } }, next: () => void) => {
    applySecurityHeaders(response);
    assertRequestSize(typeof _request.headers?.["content-length"] === "string" ? _request.headers["content-length"] : undefined);
    if (!rateLimiter.allow(_request.ip ?? String(_request.headers?.["x-forwarded-for"] ?? "unknown"))) { response.status(429).json({ error: { code: "rate_limited", message: "Too many requests.", details: {} } }); return; }
    if (!isCsrfSafeRequest(_request, env.webOrigin)) { response.status(403).json({ error: { code: "csrf_origin_required", message: "Request origin is not allowed.", details: {} } }); return; }
    next();
  });
  app.enableCors({ origin: env.webOrigin, credentials: true });
  await app.listen(env.apiPort);
}
void bootstrap();
