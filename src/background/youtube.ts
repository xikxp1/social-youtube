import { parseTimestampComments, type RawComment } from "../shared/parser";
import type { ExtensionSettings, TimestampComment } from "../shared/types";

type YouTubeCommentThreadResponse = {
  nextPageToken?: string;
  items?: YouTubeCommentThread[];
  error?: {
    message?: string;
  };
};

type YouTubeCommentThread = {
  id: string;
  snippet?: {
    topLevelComment?: {
      id?: string;
      snippet?: {
        authorDisplayName?: string;
        textDisplay?: string;
        textOriginal?: string;
        publishedAt?: string;
      };
    };
  };
};

const COMMENT_THREADS_ENDPOINT = "https://www.googleapis.com/youtube/v3/commentThreads";

export type YouTubeCommentFetchResult = {
  comments: TimestampComment[];
  rawCommentCount: number;
  pageCount: number;
  exhaustedPages: boolean;
};

function mapThreadToRawComment(thread: YouTubeCommentThread): RawComment | null {
  const topLevelComment = thread.snippet?.topLevelComment;
  const snippet = topLevelComment?.snippet;
  const text = snippet?.textOriginal ?? snippet?.textDisplay;

  if (!topLevelComment?.id || !snippet || !text) {
    return null;
  }

  return {
    id: topLevelComment.id,
    authorDisplayName: snippet.authorDisplayName ?? "YouTube viewer",
    text,
    publishedAt: snippet.publishedAt ?? ""
  };
}

export async function fetchTimestampCommentsFromYouTube(
  videoId: string,
  durationSeconds: number,
  settings: ExtensionSettings
): Promise<YouTubeCommentFetchResult> {
  const rawComments: RawComment[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  for (let page = 0; page < settings.maxPages; page += 1) {
    const params = new URLSearchParams({
      key: settings.apiKey,
      part: "snippet",
      videoId,
      textFormat: "plainText",
      maxResults: "100",
      order: "relevance"
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${COMMENT_THREADS_ENDPOINT}?${params.toString()}`);
    const data = (await response.json()) as YouTubeCommentThreadResponse;

    if (!response.ok) {
      throw new Error(data.error?.message ?? `YouTube API request failed with ${response.status}`);
    }

    pageCount += 1;

    for (const item of data.items ?? []) {
      const rawComment = mapThreadToRawComment(item);
      if (rawComment) {
        rawComments.push(rawComment);
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken) {
      break;
    }
  }

  const comments = parseTimestampComments(rawComments, durationSeconds, settings.maxCommentLength);

  return {
    comments,
    rawCommentCount: rawComments.length,
    pageCount,
    exhaustedPages: Boolean(pageToken)
  };
}
