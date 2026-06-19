import { afterEach, describe, expect, it, vi } from "vitest";
import { parseTimestampComments } from "../shared/parser";
import type { ExtensionSettings } from "../shared/types";
import { fetchTimestampCommentsFromYouTube } from "./youtube";

const settings: ExtensionSettings = {
  apiKey: "test-key",
  enabled: true,
  leadSeconds: 3,
  visibleSeconds: 8,
  maxPages: 5,
  maxCommentLength: 180
};
const originalFetch = globalThis.fetch;

function mockFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

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

  it("treats disabled comments as an empty successful result", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockFetchResponse(
        {
          error: {
            errors: [{ reason: "commentsDisabled" }],
            message: "The video identified by the videoId parameter has disabled comments."
          }
        },
        false,
        403
      )
    ) as typeof fetch;

    const result = await fetchTimestampCommentsFromYouTube("live-video", 3600, settings);

    expect(result).toEqual({
      comments: [],
      rawCommentCount: 0,
      pageCount: 0,
      exhaustedPages: false
    });
  });

  it("still throws non-disabled API errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockFetchResponse(
        {
          error: {
            errors: [{ reason: "quotaExceeded" }],
            message: "The request cannot be completed because you have exceeded your quota."
          }
        },
        false,
        403
      )
    ) as typeof fetch;

    await expect(fetchTimestampCommentsFromYouTube("video", 3600, settings)).rejects.toThrow(
      "exceeded your quota"
    );
  });
});
