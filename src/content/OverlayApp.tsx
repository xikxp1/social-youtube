import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVisibleComments } from "../shared/scheduler";
import type { CommentFetchResponse, ExtensionSettings, TimestampComment } from "../shared/types";

type OverlayAppProps = {
  video: HTMLVideoElement;
  videoId: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";
type RenderedComment = TimestampComment & {
  state: "entering" | "leaving";
};

const EXIT_ANIMATION_MS = 450;
const RESULT_STATUS_MS = 3500;

function sendMessage<TResponse>(message: unknown): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function OverlayApp({ video, videoId }: OverlayAppProps) {
  const [comments, setComments] = useState<TimestampComment[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [currentTime, setCurrentTime] = useState(video.currentTime);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [renderedComments, setRenderedComments] = useState<RenderedComment[]>([]);
  const [resultStatus, setResultStatus] = useState("");
  const hasLoadedRef = useRef(false);
  const removalTimersRef = useRef<Map<string, number>>(new Map());

  const loadComments = useCallback(async () => {
    if (hasLoadedRef.current || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    hasLoadedRef.current = true;
    setLoadState("loading");
    setError("");
    setResultStatus("");

    let response: CommentFetchResponse;
    try {
      response = await sendMessage<CommentFetchResponse>({
        type: "GET_TIMESTAMP_COMMENTS",
        videoId,
        durationSeconds: video.duration
      });
    } catch {
      setComments([]);
      setError("Social Youtube is not connected. Reload this YouTube tab.");
      setLoadState("error");
      return;
    }

    setSettings(response.settings);

    if (response.ok) {
      setComments(response.comments);
      setResultStatus(
        response.comments.length === 0
          ? "No one-timestamp comments found"
          : `${response.comments.length} one-timestamp comments found`
      );
      setLoadState("ready");
    } else {
      setComments([]);
      setError(response.error);
      setLoadState("error");
    }
  }, [video, videoId]);

  useEffect(() => {
    hasLoadedRef.current = false;
    setComments([]);
    setRenderedComments([]);
    setLoadState("idle");
    setError("");
    setResultStatus("");
    setCurrentTime(video.currentTime);

    const handleReady = () => {
      void loadComments();
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("durationchange", handleReady);
    video.addEventListener("play", handleReady);
    void loadComments();

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("durationchange", handleReady);
      video.removeEventListener("play", handleReady);
    };
  }, [loadComments, video, videoId]);

  useEffect(() => {
    let isMounted = true;

    void sendMessage<{ ok: true; settings: ExtensionSettings }>({ type: "GET_SETTINGS" })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setSettings(response.settings);
        if (response.settings.enabled && !response.settings.apiKey) {
          setError("Add a YouTube Data API key in extension options.");
          setLoadState("error");
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Social Youtube is not connected. Reload this YouTube tab.");
          setLoadState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(video.currentTime);
    }, 300);

    return () => {
      window.clearInterval(timer);
    };
  }, [video]);

  useEffect(() => {
    const handleChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "sync" && changes.timestampCommentSettings?.newValue) {
        setSettings(changes.timestampCommentSettings.newValue as ExtensionSettings);
        hasLoadedRef.current = false;
        setComments([]);
        setRenderedComments([]);
        setLoadState("idle");
        setResultStatus("");
      }
    };

    chrome.storage.onChanged.addListener(handleChanged);
    return () => {
      chrome.storage.onChanged.removeListener(handleChanged);
    };
  }, []);

  const visibleComments = useMemo(() => {
    if (!settings || !settings.enabled) {
      return [];
    }

    return getVisibleComments(
      comments,
      currentTime,
      settings.leadSeconds,
      settings.visibleSeconds,
      5
    );
  }, [comments, currentTime, settings]);

  useEffect(() => {
    const visibleKeys = new Set(
      visibleComments.map((comment) => `${comment.id}-${comment.timestampSeconds}`)
    );

    setRenderedComments((current) => {
      const currentByKey = new Map(
        current.map((comment) => [`${comment.id}-${comment.timestampSeconds}`, comment])
      );
      const next: RenderedComment[] = visibleComments.map((comment) => {
        const key = `${comment.id}-${comment.timestampSeconds}`;
        window.clearTimeout(removalTimersRef.current.get(key));
        removalTimersRef.current.delete(key);
        return { ...comment, state: "entering" };
      });

      for (const comment of current) {
        const key = `${comment.id}-${comment.timestampSeconds}`;
        if (visibleKeys.has(key) || currentByKey.get(key)?.state === "leaving") {
          continue;
        }

        next.push({ ...comment, state: "leaving" });
        const timer = window.setTimeout(() => {
          removalTimersRef.current.delete(key);
          setRenderedComments((latest) =>
            latest.filter((item) => `${item.id}-${item.timestampSeconds}` !== key)
          );
        }, EXIT_ANIMATION_MS);
        removalTimersRef.current.set(key, timer);
      }

      return next.slice(-5);
    });
  }, [visibleComments]);

  useEffect(() => {
    return () => {
      for (const timer of removalTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      removalTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!resultStatus) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResultStatus("");
    }, RESULT_STATUS_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [resultStatus]);

  const statusText = useMemo(() => {
    if (settings && !settings.enabled) {
      return "";
    }

    if (loadState === "loading") {
      return "Loading timestamp comments";
    }

    if (loadState === "error") {
      return error;
    }

    if (loadState === "ready") {
      return resultStatus;
    }

    return "";
  }, [error, loadState, resultStatus, settings]);

  return (
    <div className="ytc-root">
      <div className="ytc-feed" aria-live="polite" aria-label="Timestamp comments">
        {renderedComments.map((comment) => (
          <article
            className="ytc-comment"
            data-state={comment.state}
            key={`${comment.id}-${comment.timestampSeconds}`}
          >
            <div className="ytc-meta">
              <span className="ytc-author">{comment.authorDisplayName}</span>
              <span className="ytc-time">{formatTimestamp(comment.timestampSeconds)}</span>
            </div>
            <div className="ytc-text" title={comment.text}>
              {comment.text}
            </div>
          </article>
        ))}
      </div>

      {statusText ? <div className="ytc-status">{statusText}</div> : null}
    </div>
  );
}
