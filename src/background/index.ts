import { fetchTimestampCommentsFromYouTube } from "./youtube";
import { loadSettings, saveSettings } from "../shared/settings";
import type { CommentFetchRequest, CommentFetchResponse, ExtensionSettings } from "../shared/types";

type RuntimeRequest =
  | CommentFetchRequest
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: ExtensionSettings }
  | { type: "CLEAR_CACHE" };

async function getTimestampComments(
  request: CommentFetchRequest
): Promise<CommentFetchResponse> {
  const startedAt = performance.now();
  const settings = await loadSettings();

  if (!settings.enabled) {
    logParseStats({
      videoId: request.videoId,
      source: "disabled",
      rawCommentCount: 0,
      parsedCommentCount: 0,
      pageCount: 0,
      durationMs: performance.now() - startedAt
    });
    return { ok: true, source: "api", comments: [], settings };
  }

  if (!settings.apiKey) {
    logParseStats({
      videoId: request.videoId,
      source: "missing-api-key",
      rawCommentCount: 0,
      parsedCommentCount: 0,
      pageCount: 0,
      durationMs: performance.now() - startedAt
    });
    return { ok: false, error: "Add a YouTube Data API key in extension options.", settings };
  }

  try {
    const result = await fetchTimestampCommentsFromYouTube(
      request.videoId,
      request.durationSeconds,
      settings
    );
    const comments = result.comments;
    logParseStats({
      videoId: request.videoId,
      source: "api",
      rawCommentCount: result.rawCommentCount,
      parsedCommentCount: comments.length,
      pageCount: result.pageCount,
      durationMs: performance.now() - startedAt,
      exhaustedPages: result.exhaustedPages
    });
    return { ok: true, source: "api", comments, settings };
  } catch (error) {
    logParseStats({
      videoId: request.videoId,
      source: "api-error",
      rawCommentCount: 0,
      parsedCommentCount: 0,
      pageCount: 0,
      durationMs: performance.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to fetch timestamp comments.",
      settings
    };
  }
}

function logParseStats(stats: {
  videoId: string;
  source: "api" | "api-error" | "disabled" | "missing-api-key";
  rawCommentCount: number | null;
  parsedCommentCount: number;
  pageCount: number;
  durationMs: number;
  exhaustedPages?: boolean;
  error?: string;
}): void {
  console.info("[Social Youtube] comment parsing stats", {
    videoId: stats.videoId,
    source: stats.source,
    rawCommentCount: stats.rawCommentCount,
    parsedCommentCount: stats.parsedCommentCount,
    pageCount: stats.pageCount,
    durationMs: Math.round(stats.durationMs),
    exhaustedPages: stats.exhaustedPages ?? false,
    error: stats.error
  });
}

async function clearLegacyCommentCache(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((key) => key.startsWith("timestampComments:"));
  if (keys.length > 0) {
    await chrome.storage.local.remove(keys);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(saveSettings);
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((request: RuntimeRequest, _sender, sendResponse) => {
  const respond = async () => {
    if (request.type === "GET_TIMESTAMP_COMMENTS") {
      return getTimestampComments(request);
    }

    if (request.type === "GET_SETTINGS") {
      return { ok: true, settings: await loadSettings() };
    }

    if (request.type === "SAVE_SETTINGS") {
      return { ok: true, settings: await saveSettings(request.settings) };
    }

    if (request.type === "CLEAR_CACHE") {
      await clearLegacyCommentCache();
      return { ok: true };
    }

    return { ok: false, error: "Unknown request." };
  };

  void respond().then(sendResponse);
  return true;
});
