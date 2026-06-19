export type ExtensionSettings = {
  apiKey: string;
  enabled: boolean;
  leadSeconds: number;
  visibleSeconds: number;
  maxPages: number;
  maxCommentLength: number;
};

export type TimestampComment = {
  id: string;
  authorDisplayName: string;
  text: string;
  originalTextLength: number;
  timestampSeconds: number;
  publishedAt: string;
};

export type CommentFetchRequest = {
  type: "GET_TIMESTAMP_COMMENTS";
  videoId: string;
  durationSeconds: number;
};

export type CommentFetchResponse =
  | {
      ok: true;
      source: "api";
      comments: TimestampComment[];
      settings: ExtensionSettings;
    }
  | {
      ok: false;
      error: string;
      settings: ExtensionSettings;
    };

export type SettingsResponse = {
  type: "SETTINGS_UPDATED";
  settings: ExtensionSettings;
};
