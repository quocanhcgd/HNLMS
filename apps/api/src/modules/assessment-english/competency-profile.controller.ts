import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import {
  CompetencyProfileError,
  CompetencyProfileService,
  type CompetencyProfileActor,
  type CompetencyReviewCommand,
} from "./competency-profile.service";
import { InMemoryCompetencyProfileRepository } from "./in-memory-competency-profile-repository";
import { demoCompetencyProfiles } from "./demo-competency-profiles";
import { DrizzleCompetencyProfileRepository } from "./drizzle-competency-profile-repository";
import { DrizzleLegacyEnglishMigrationRepository } from "./drizzle-legacy-english-migration-repository";
import { InMemoryLegacyEnglishMigrationRepository } from "./in-memory-legacy-english-migration-repository";
import { LegacyEnglishMigrationService } from "./legacy-english-migration.service";
import { createDatabase } from "../../database/client";
import type { CompetencyProfileRepository } from "./competency-profile.service";

type HeaderMap = Record<string, string | string[] | undefined>;

function header(headers: HeaderMap, key: string): string {
  const value = headers[key];
  return Array.isArray(value) ? (value[0] ?? "") : String(value ?? "");
}

function values(headers: HeaderMap, key: string): Set<string> {
  return new Set(
    header(headers, key)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function optionalValues(headers: HeaderMap, key: string): Set<string> | undefined {
  const result = values(headers, key);
  return result.size ? result : undefined;
}

function staffActor(headers: HeaderMap): CompetencyProfileActor {
  return {
    userId: header(headers, "x-user-id"),
    organizationId: header(headers, "x-organization-id"),
    role: (header(headers, "x-role") || "staff") as CompetencyProfileActor["role"],
    permissions: values(headers, "x-permissions"),
    studentIds: optionalValues(headers, "x-student-ids"),
    branchIds: optionalValues(headers, "x-branch-ids"),
    classIds: optionalValues(headers, "x-class-ids"),
    subjectIds: optionalValues(headers, "x-subject-ids"),
    programIds: optionalValues(headers, "x-program-ids"),
  };
}

function publicationActor(headers: HeaderMap): CompetencyProfileActor {
  return {
    ...staffActor(headers),
    role: (header(headers, "x-role") || "academic_affairs") as CompetencyProfileActor["role"],
  };
}

function createRepository(): CompetencyProfileRepository {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      return new DrizzleCompetencyProfileRepository(createDatabase({ url: databaseUrl }).db);
    } catch {
      if (process.env.NODE_ENV === "production") throw new Error("competency_database_initialization_failed");
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL_required_for_competency_profiles");
  return new InMemoryCompetencyProfileRepository(structuredClone(demoCompetencyProfiles));
}

function createMigrationService(): LegacyEnglishMigrationService {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      return new LegacyEnglishMigrationService(
        new DrizzleLegacyEnglishMigrationRepository(createDatabase({ url: databaseUrl }).db),
      );
    } catch {
      if (process.env.NODE_ENV === "production") throw new Error("competency_database_initialization_failed");
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL_required_for_legacy_migration");
  return new LegacyEnglishMigrationService(new InMemoryLegacyEnglishMigrationRepository());
}

@Controller()
export class CompetencyProfileController {
  private readonly service = new CompetencyProfileService(createRepository());
  private readonly migrationService = createMigrationService();

  @Get("competency-profiles")
  listStaff(@Headers() headers: HeaderMap, @Query() query: Record<string, string | undefined>) {
    return this.service.listForStaff(staffActor(headers), {
      studentId: query.student_id,
      subjectId: query.subject_id,
      programId: query.program_id,
      classId: query.class_id,
    });
  }

  @Post("competency-profiles/reviews")
  review(@Headers() headers: HeaderMap, @Body() body: CompetencyReviewCommand) {
    return this.execute(() => this.service.review(staffActor(headers), body));
  }

  @Get("competency-profiles/:profileId/history")
  history(@Headers() headers: HeaderMap, @Param("profileId") profileId: string) {
    return this.execute(() => this.service.listHistoryForStaff(staffActor(headers), profileId));
  }

  @Post("competency-profiles/publications")
  approvePublication(@Headers() headers: HeaderMap, @Body() body: Omit<CompetencyReviewCommand, "action">) {
    return this.execute(() => this.service.approvePublication(publicationActor(headers), body));
  }

  /** Imports legacy English skill records using enrollment/class/program context. */
  @Post("competency-profiles/legacy-migration")
  migrateLegacy(@Headers() headers: HeaderMap) {
    return this.executeMigration(() =>
      this.migrationService.migrate({
        userId: header(headers, "x-user-id"),
        organizationId: header(headers, "x-organization-id"),
        canMigrateLegacyEnglish: values(headers, "x-permissions").has("competency:migrate"),
      }),
    );
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof CompetencyProfileError) {
        if (error.code === "forbidden") throw new ForbiddenException(error.message);
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async executeMigration<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code?: string }).code === "forbidden") {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Get("students/:studentId/competency-profiles")
  listStudent(
    @Headers() headers: HeaderMap,
    @Param("studentId") studentId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.service.listForStudent(
      {
        userId: header(headers, "x-user-id"),
        organizationId: header(headers, "x-organization-id"),
        role: "student",
        studentId: header(headers, "x-student-id") || studentId,
      },
      studentId,
      { subjectId: query.subject_id, programId: query.program_id, classId: query.class_id },
    );
  }

  @Get("parent/students/:studentId/competency-profiles")
  listParent(
    @Headers() headers: HeaderMap,
    @Param("studentId") studentId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.service.listForParent(
      {
        userId: header(headers, "x-user-id"),
        organizationId: header(headers, "x-organization-id"),
        role: "parent",
        parentPermissionsByStudentId: new Map([[studentId, values(headers, "x-parent-permissions")]]),
      },
      studentId,
      { subjectId: query.subject_id, programId: query.program_id, classId: query.class_id },
    );
  }
}
