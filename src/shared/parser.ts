import type { TimestampComment } from "./types";

export type RawComment = {
  id: string;
  authorDisplayName: string;
  text: string;
  publishedAt: string;
};

type ParsedTimestamp = {
  raw: string;
  seconds: number;
};

const TIMESTAMP_PATTERN = /(?<!\d)(\d{1,2}):([0-5]\d)(?::([0-5]\d))?(?!\d)/g;
const LEADING_TIMESTAMP_PATTERN = /^\s*\d{1,2}:[0-5]\d(?::[0-5]\d)?(?:\s*[-–—:|]\s*|\s+)/;

export function trimCommentText(text: string, maxLength: number): { text: string; originalTextLength: number } {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return { text: normalized, originalTextLength: normalized.length };
  }

  return {
    text: `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`,
    originalTextLength: normalized.length
  };
}

export function normalizeCommentDisplayText(text: string): string {
  return text.replace(LEADING_TIMESTAMP_PATTERN, "").trim();
}

export function parseTimestamps(text: string, durationSeconds: number): ParsedTimestamp[] {
  const matches = [...text.matchAll(TIMESTAMP_PATTERN)];
  const valid: ParsedTimestamp[] = [];

  for (const match of matches) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const third = match[3] === undefined ? undefined : Number(match[3]);
    const seconds = third === undefined ? first * 60 + second : first * 3600 + second * 60 + third;

    if (Number.isFinite(seconds) && seconds >= 0 && seconds <= durationSeconds) {
      valid.push({ raw: match[0], seconds });
    }
  }

  return valid;
}

export function parseTimestampComment(
  comment: RawComment,
  durationSeconds: number,
  maxCommentLength: number
): TimestampComment | null {
  const timestamps = parseTimestamps(comment.text, durationSeconds);
  if (timestamps.length !== 1) {
    return null;
  }

  const displayText = normalizeCommentDisplayText(comment.text);
  const trimmed = trimCommentText(displayText, maxCommentLength);
  return {
    id: comment.id,
    authorDisplayName: comment.authorDisplayName,
    text: trimmed.text,
    originalTextLength: trimmed.originalTextLength,
    timestampSeconds: timestamps[0].seconds,
    publishedAt: comment.publishedAt
  };
}

export function parseTimestampComments(
  comments: RawComment[],
  durationSeconds: number,
  maxCommentLength: number
): TimestampComment[] {
  const parsed: TimestampComment[] = [];

  for (const comment of comments) {
    const timestampComment = parseTimestampComment(comment, durationSeconds, maxCommentLength);
    if (timestampComment) {
      parsed.push(timestampComment);
    }
  }

  return [...parsed].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}
