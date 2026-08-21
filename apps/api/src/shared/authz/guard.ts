import { assertAuthorized, type AuthorizationContext } from "@hnlms/authorization";
import type { GuardRequirement } from "./context";

export function enforceGuard(context: AuthorizationContext | undefined, requirement: GuardRequirement): true {
  if (!context) throw new Error("unauthenticated");
  assertAuthorized(context, requirement.permission, requirement.resource);
  return true;
}
