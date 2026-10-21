import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { InMemoryProgramCompetencyRepository } from "./in-memory-program-competency-repository";
import { ProgramCompetencyService } from "./program-competency.service";

type HeaderMap = Record<string, string | string[] | undefined>;

function value(headers: HeaderMap, key: string): string {
  const header = headers[key];
  return Array.isArray(header) ? header[0] ?? "" : String(header ?? "");
}

function set(headers: HeaderMap, key: string): Set<string> {
  return new Set(value(headers, key).split(",").map((item) => item.trim()).filter(Boolean));
}

function actor(headers: HeaderMap) {
  const permissions = set(headers, "x-permissions");
  return {
    userId: value(headers, "x-user-id"),
    organizationId: value(headers, "x-organization-id"),
    canManagePrograms: permissions.has("programs:manage"),
    subjectIds: set(headers, "x-subject-ids"),
    programIds: set(headers, "x-program-ids"),
  };
}

@Controller("program-competency")
export class ProgramCompetencyController {
  private readonly service = new ProgramCompetencyService(new InMemoryProgramCompetencyRepository());

  @Get("blueprints")
  list(@Headers() headers: HeaderMap) {
    return this.service.listBlueprints(actor(headers));
  }

  @Get("blueprints/:blueprintId")
  get(@Headers() headers: HeaderMap, @Param("blueprintId") blueprintId: string) {
    return this.service.getBlueprint(actor(headers), blueprintId);
  }

  @Post("blueprints")
  create(@Headers() headers: HeaderMap, @Body() body: unknown) {
    return this.service.createDraft(actor(headers), body);
  }

  @Post("blueprints/:blueprintId/publish")
  publish(@Headers() headers: HeaderMap, @Param("blueprintId") blueprintId: string) {
    return this.service.publishBlueprint(actor(headers), blueprintId);
  }
}
