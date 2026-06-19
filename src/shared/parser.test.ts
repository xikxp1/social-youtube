import { describe, expect, it } from "vitest";
import { normalizeCommentDisplayText, parseTimestampComment, parseTimestamps, trimCommentText } from "./parser";

describe("parseTimestamps", () => {
  it("accepts supported timestamp formats", () => {
    expect(parseTimestamps("start 0:05 middle 12:34 late 1:02:03", 4000)).toEqual([
      { raw: "0:05", seconds: 5 },
      { raw: "12:34", seconds: 754 },
      { raw: "1:02:03", seconds: 3723 }
    ]);
  });

  it("rejects malformed timestamps", () => {
    expect(parseTimestamps("bad 1:99 and 123:45 and 1:2", 5000)).toEqual([]);
  });

  it("rejects timestamps beyond duration", () => {
    expect(parseTimestamps("watch 10:00", 300)).toEqual([]);
  });
});

describe("parseTimestampComment", () => {
  const baseComment = {
    id: "comment-1",
    authorDisplayName: "Viewer",
    publishedAt: "2026-06-19T00:00:00Z"
  };

  it("accepts exactly one valid timestamp", () => {
    expect(
      parseTimestampComment({ ...baseComment, text: "This part at 1:05 is strong" }, 120, 180)
    ).toMatchObject({
      id: "comment-1",
      timestampSeconds: 65,
      text: "This part at 1:05 is strong"
    });
  });

  it("rejects comments with zero valid timestamps", () => {
    expect(parseTimestampComment({ ...baseComment, text: "No timestamp here" }, 120, 180)).toBeNull();
  });

  it("rejects comments with multiple valid timestamps", () => {
    expect(parseTimestampComment({ ...baseComment, text: "Compare 0:10 and 0:20" }, 120, 180)).toBeNull();
  });

  it("ignores invalid matches before enforcing the exactly-one rule", () => {
    expect(
      parseTimestampComment({ ...baseComment, text: "Good 0:20 but bad 0:99" }, 120, 180)
    ).toMatchObject({ timestampSeconds: 20 });
  });

  it("removes a leading timestamp from displayed comment text", () => {
    expect(
      parseTimestampComment({ ...baseComment, text: "1:05 - This part is strong" }, 120, 180)
    ).toMatchObject({
      timestampSeconds: 65,
      text: "This part is strong"
    });
  });

  it("keeps a timestamp in the middle of displayed comment text", () => {
    expect(
      parseTimestampComment({ ...baseComment, text: "This part at 1:05 is strong" }, 120, 180)
    ).toMatchObject({
      timestampSeconds: 65,
      text: "This part at 1:05 is strong"
    });
  });
});

describe("normalizeCommentDisplayText", () => {
  it("removes supported leading timestamp separators", () => {
    expect(normalizeCommentDisplayText("0:05 intro")).toBe("intro");
    expect(normalizeCommentDisplayText("0:05: intro")).toBe("intro");
    expect(normalizeCommentDisplayText("0:05 - intro")).toBe("intro");
  });

  it("does not remove timestamps after other text", () => {
    expect(normalizeCommentDisplayText("watch 0:05 intro")).toBe("watch 0:05 intro");
  });
});

describe("trimCommentText", () => {
  it("leaves short comments unchanged", () => {
    expect(trimCommentText("  short   comment ", 20)).toEqual({
      text: "short comment",
      originalTextLength: 13
    });
  });

  it("trims long comments and appends an ellipsis", () => {
    expect(trimCommentText("abcdefghijklmnopqrstuvwxyz", 10)).toEqual({
      text: "abcdefghi...",
      originalTextLength: 26
    });
  });
});
