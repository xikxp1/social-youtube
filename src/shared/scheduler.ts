import type { TimestampComment } from "./types";

export function getVisibleComments(
  comments: TimestampComment[],
  currentTimeSeconds: number,
  leadSeconds: number,
  visibleSeconds: number,
  limit = 5
): TimestampComment[] {
  const visible = comments.filter((comment) => {
    const startsAt = Math.max(0, comment.timestampSeconds - leadSeconds);
    const endsAt = startsAt + visibleSeconds;
    return currentTimeSeconds >= startsAt && currentTimeSeconds <= endsAt;
  });

  return visible.slice(-limit);
}
