import { Body, Controller, Get, Headers, Param, Post, Put } from "@nestjs/common";
import type { ThemePreset } from "./service";
import { InMemoryOrganizationBranchRepository, OrganizationBranchService } from "./service";

@Controller("organization")
export class OrganizationSettingsController {
  private readonly service = new OrganizationBranchService(new InMemoryOrganizationBranchRepository());
  private context(headers: Record<string, string | string[] | undefined>) {
    return { organizationId: String(headers["x-organization-id"] ?? ""), userId: String(headers["x-user-id"] ?? "") };
  }
  @Get("settings/:key") getSetting(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("key") key: string,
  ) {
    return this.service.getSetting(this.context(headers), key);
  }
  @Put("settings/:key") saveSetting(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("key") key: string,
    @Body() body: { value: unknown; expectedVersion?: number },
  ) {
    return this.service.saveSetting(this.context(headers), key, body.value, body.expectedVersion);
  }
  @Get("theme") getTheme(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.service.getTheme(this.context(headers));
  }
  @Post("themes/preview") preview(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: ThemePreset,
  ) {
    return this.service.previewTheme(this.context(headers), body);
  }
  @Post("themes/:version/publish") publish(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("version") version: string,
  ) {
    return this.service.publishTheme(this.context(headers), Number(version));
  }
  @Post("themes/:version/rollback") rollback(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("version") version: string,
  ) {
    return this.service.rollbackTheme(this.context(headers), Number(version));
  }
}
