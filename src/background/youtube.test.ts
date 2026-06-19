import { describe, expect, it } from "vitest";
import { parseTimestampComments } from "../shared/parser";

describe("api comment mapping behavior", () => {
  it("parses only top-level comments with exactly one valid timestamp", () => {
    const parsed = parseTimestampComments(
      [
        {
          id: "one",
          authorDisplayName: "A",
          text: "Great moment 0:12",
          publishedAt: "2026-06-19T00:00:00Z"
        },
        {
          id: "two",
          authorDisplayName: "B",
          text: "Compare 0:12 and 0:20",
          publishedAt: "2026-06-19T00:00:00Z"
        },
        {
          id: "three",
          authorDisplayName: "C",
          text: "No marker",
          publishedAt: "2026-06-19T00:00:00Z"
        }
      ],
      60,
      180
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ id: "one", timestampSeconds: 12 });
  });
});
