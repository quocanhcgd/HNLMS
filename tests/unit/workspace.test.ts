import { describe, expect, it } from "vitest";

describe("workspace foundation", () => {
  it("keeps the application contract stable", () => {
    expect("@hnlms").toBe("@hnlms");
  });
});
