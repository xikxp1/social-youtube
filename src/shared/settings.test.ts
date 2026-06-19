import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, sanitizeSettings } from "./settings";

describe("sanitizeSettings", () => {
  it("falls back to defaults for non-finite numeric values", () => {
    const sanitized = sanitizeSettings({
      leadSeconds: Number.NaN,
      visibleSeconds: Infinity,
      maxPages: "not-a-number" as unknown as number,
      maxCommentLength: -Infinity
    });

    expect(sanitized).toMatchObject({
      leadSeconds: DEFAULT_SETTINGS.leadSeconds,
      visibleSeconds: DEFAULT_SETTINGS.visibleSeconds,
      maxPages: DEFAULT_SETTINGS.maxPages,
      maxCommentLength: DEFAULT_SETTINGS.maxCommentLength
    });
  });

  it("clamps finite numeric values to allowed ranges", () => {
    const sanitized = sanitizeSettings({
      leadSeconds: -1,
      visibleSeconds: 99,
      maxPages: 99,
      maxCommentLength: 20
    });

    expect(sanitized).toMatchObject({
      leadSeconds: 0,
      visibleSeconds: 30,
      maxPages: 20,
      maxCommentLength: 60
    });
  });
});
