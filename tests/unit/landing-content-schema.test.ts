import { describe, expect, it } from "vitest";
import {
  isPublicVisible,
  publishLandingContent,
  publicationGuard,
  revokeLandingContent,
} from "../../apps/api/src/modules/marketing-admission/schema";

const now = new Date("2026-08-21T12:00:00Z");

describe("landing content publication lifecycle", () => {
  it("marks published status as public-visible", () => {
    expect(isPublicVisible("draft")).toBe(false);
    expect(isPublicVisible("review")).toBe(false);
    expect(isPublicVisible("published")).toBe(true);
    expect(isPublicVisible("revoked")).toBe(false);
  });

  it("guards publication visibility", () => {
    expect(() => publicationGuard("published")).not.toThrow();
    expect(() => publicationGuard("draft")).toThrow("landing_content_not_published");
  });

  it("transitions draft or review content to published with bumped version", () => {
    const result = publishLandingContent({ status: "draft", nextVersion: 2, actorUserId: "admin-1", now });

    expect(result).toEqual({
      status: "published",
      version: 2,
      publishedAt: now,
      revokedAt: null,
      publishedByUserId: "admin-1",
      revokedByUserId: null,
      updatedAt: now,
    });
  });

  it("rejects publishing already published content", () => {
    expect(() => publishLandingContent({ status: "published", nextVersion: 3, actorUserId: "admin-1", now })).toThrow(
      "landing_content_already_published",
    );
  });

  it("rejects publishing revoked content without explicit draft versioning", () => {
    expect(() => publishLandingContent({ status: "revoked", nextVersion: 4, actorUserId: "admin-1", now })).toThrow(
      "landing_content_revoked",
    );
  });

  it("rejects nextVersion below 1", () => {
    expect(() => publishLandingContent({ status: "review", nextVersion: 0, actorUserId: "admin-1", now })).toThrow(
      "landing_content_next_version_invalid",
    );
  });

  it("revokes published content and records actor and timestamp", () => {
    const result = revokeLandingContent({ status: "published", actorUserId: "admin-1", now });

    expect(result).toEqual({
      status: "revoked",
      revokedAt: now,
      revokedByUserId: "admin-1",
      updatedAt: now,
    });
  });

  it("rejects revocation when content is not published", () => {
    expect(() => revokeLandingContent({ status: "draft", actorUserId: "admin-1", now })).toThrow(
      "landing_content_not_published",
    );
  });
});
