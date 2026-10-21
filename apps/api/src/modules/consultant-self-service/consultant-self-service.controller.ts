import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Headers, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ConsultantSelfServiceError, ConsultantSelfServiceService, type ConsultantActor } from "./consultant-self-service.service";

type HeaderMap = Record<string, string | string[] | undefined>;
const value = (headers: HeaderMap, key: string) => { const item = headers[key]; return Array.isArray(item) ? item[0] ?? "" : String(item ?? ""); };

@Controller("consultant/self")
export class ConsultantSelfServiceController {
  private readonly service = new ConsultantSelfServiceService();
  private actor(headers: HeaderMap): ConsultantActor { return { userId: value(headers, "x-user-id"), organizationId: value(headers, "x-organization-id"), role: value(headers, "x-role") }; }
  private execute<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ConsultantSelfServiceError)) throw error;
      if (error.code === "forbidden") throw new ForbiddenException(error.code);
      if (error.code === "not_found") throw new NotFoundException(error.code);
      if (error.code === "invalid_transition") throw new ConflictException(error.code);
      throw new BadRequestException(error.code);
    }
  }
  @Get("work") listWork(@Headers() headers: HeaderMap) { return this.execute(() => this.service.listWork(this.actor(headers))); }
  @Post("work/:id/start") start(@Headers() headers: HeaderMap, @Param("id") id: string) { return this.execute(() => this.service.transitionWork(this.actor(headers), id, "start")); }
  @Post("work/:id/end") end(@Headers() headers: HeaderMap, @Param("id") id: string) { return this.execute(() => this.service.transitionWork(this.actor(headers), id, "end")); }
  @Post("work/:id/adjust") adjust(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { reason?: string }) { return this.execute(() => this.service.transitionWork(this.actor(headers), id, "adjust", body?.reason)); }
  @Get("leaves") listLeaves(@Headers() headers: HeaderMap) { return this.execute(() => this.service.listLeaves(this.actor(headers))); }
  @Post("leaves") createLeave(@Headers() headers: HeaderMap, @Body() body: Record<string, unknown>) { return this.execute(() => this.service.createLeave(this.actor(headers), body)); }
  @Post("leaves/:id/cancel") cancelLeave(@Headers() headers: HeaderMap, @Param("id") id: string) { return this.execute(() => this.service.cancelLeave(this.actor(headers), id)); }
  @Get("payroll") payroll(@Headers() headers: HeaderMap, @Query("period") period = "2026-08") { return this.execute(() => this.service.getPayroll(this.actor(headers), period)); }
}
