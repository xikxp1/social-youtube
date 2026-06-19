import { describe, expect, it } from "vitest";
import { getVisibleComments } from "./scheduler";
import type { TimestampComment } from "./types";

const comment = (id: string, timestampSeconds: number): TimestampComment => ({
  id,
  timestampSeconds,
  authorDisplayName: "Viewer",
  text: `comment ${id}`,
  originalTextLength: 9,
  publishedAt: "2026-06-19T00:00:00Z"
});

describe("getVisibleComments", () => {
  it("shows comments from lead window through visible duration", () => {
    const comments = [comment("a", 10)];

    expect(getVisibleComments(comments, 6.9, 3, 8)).toEqual([]);
    expect(getVisibleComments(comments, 7, 3, 8)).toHaveLength(1);
    expect(getVisibleComments(comments, 15, 3, 8)).toHaveLength(1);
    expect(getVisibleComments(comments, 15.1, 3, 8)).toEqual([]);
  });

  it("limits visible comments to the latest entries", () => {
    const comments = ["a", "b", "c", "d", "e", "f"].map((id) => comment(id, 10));
    expect(getVisibleComments(comments, 10, 3, 8, 5).map((item) => item.id)).toEqual([
      "b",
      "c",
      "d",
      "e",
      "f"
    ]);
  });
});
