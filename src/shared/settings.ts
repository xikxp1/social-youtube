import type { ExtensionSettings } from "./types";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: "",
  enabled: true,
  leadSeconds: 3,
  visibleSeconds: 8,
  maxPages: 5,
  maxCommentLength: 180
};

const SETTINGS_KEY = "timestampCommentSettings";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const finiteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const sanitizeNumber = (value: unknown, fallback: number, min: number, max: number) =>
  clamp(finiteNumber(value, fallback), min, max);

export function sanitizeSettings(raw: Partial<ExtensionSettings> = {}): ExtensionSettings {
  return {
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey.trim() : DEFAULT_SETTINGS.apiKey,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_SETTINGS.enabled,
    leadSeconds: sanitizeNumber(raw.leadSeconds, DEFAULT_SETTINGS.leadSeconds, 0, 30),
    visibleSeconds: sanitizeNumber(raw.visibleSeconds, DEFAULT_SETTINGS.visibleSeconds, 3, 30),
    maxPages: Math.round(sanitizeNumber(raw.maxPages, DEFAULT_SETTINGS.maxPages, 1, 20)),
    maxCommentLength: Math.round(
      sanitizeNumber(raw.maxCommentLength, DEFAULT_SETTINGS.maxCommentLength, 60, 500)
    )
  };
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return sanitizeSettings(stored[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined);
}

export async function saveSettings(settings: ExtensionSettings): Promise<ExtensionSettings> {
  const sanitized = sanitizeSettings(settings);
  await chrome.storage.sync.set({ [SETTINGS_KEY]: sanitized });
  return sanitized;
}

export function settingsHash(settings: ExtensionSettings): string {
  return JSON.stringify({
    leadSeconds: settings.leadSeconds,
    visibleSeconds: settings.visibleSeconds,
    maxPages: settings.maxPages,
    maxCommentLength: settings.maxCommentLength
  });
}
