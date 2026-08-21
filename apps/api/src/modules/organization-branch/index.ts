import { Module } from "@nestjs/common";
import { OrganizationSettingsController } from "./controller";
export * from "./service";
export * from "./schema";
@Module({ controllers: [OrganizationSettingsController] })
export class OrganizationBranchModule {}
