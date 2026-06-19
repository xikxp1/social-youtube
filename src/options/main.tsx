import { Button, Card, Description, Input, Label, TextField } from "@heroui/react";
import { RotateCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_SETTINGS, sanitizeSettings } from "../shared/settings";
import type { ExtensionSettings } from "../shared/types";
import "../styles/options.css";

type Status = {
  tone: "neutral" | "success" | "danger";
  message: string;
};

function sendMessage<TResponse>(message: unknown): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

function parseNumericValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function SettingsField({
  id,
  label,
  description,
  value,
  min,
  max,
  onChange
}: {
  id: keyof Pick<
    ExtensionSettings,
    "leadSeconds" | "visibleSeconds" | "maxPages" | "maxCommentLength"
  >;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (key: SettingsFieldProps["id"], value: number) => void;
}) {
  return (
    <TextField className="settings-row">
      <div className="settings-copy">
        <Label htmlFor={id}>{label}</Label>
        <Description>{description}</Description>
      </div>
      <Input
        className="settings-control"
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(id, parseNumericValue(event.currentTarget.value, value))}
        type="number"
        value={String(value)}
        variant="secondary"
      />
    </TextField>
  );
}

type SettingsFieldProps = Parameters<typeof SettingsField>[0];

function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Status>({
    tone: "neutral",
    message: "Settings apply the next time a video loads comments."
  });

  useEffect(() => {
    let isMounted = true;

    void sendMessage<{ ok: true; settings: ExtensionSettings }>({ type: "GET_SETTINGS" }).then((response) => {
      if (isMounted) {
        setSettings(sanitizeSettings(response.settings));
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sanitizedSettings = useMemo(() => sanitizeSettings(settings), [settings]);

  const updateNumeric = (key: SettingsFieldProps["id"], value: number) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void sendMessage<{ ok: true; settings: ExtensionSettings }>({
      type: "SAVE_SETTINGS",
      settings: sanitizedSettings
    }).then((response) => {
      setSettings(response.settings);
      setStatus({ tone: "success", message: "Settings saved." });
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setStatus({ tone: "neutral", message: "Defaults restored locally. Save to apply them." });
  };

  return (
    <main className="options-shell">
      <section className="options-header">
        <img className="app-logo" src="/icons/icon-128.png" alt="" aria-hidden="true" />
        <div>
          <h1>Social Youtube</h1>
          <p className="lede">
            Show one-timestamp comments as a compact feed over the video.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit}>
        <Card className="settings-card">
          <Card.Content className="settings-grid">
            <TextField className="settings-row settings-field-wide">
              <div className="settings-copy">
                <Label htmlFor="apiKey">YouTube Data API Key</Label>
                <Description>The key stays in Chrome sync storage for this extension.</Description>
              </div>
              <Input
                autoComplete="off"
                className="settings-control api-key-control"
                id="apiKey"
                onChange={(event) =>
                  setSettings((current) => ({ ...current, apiKey: event.currentTarget.value }))
                }
                placeholder="AIza..."
                type="password"
                value={settings.apiKey}
                variant="secondary"
              />
            </TextField>

            <div className="toggle-row">
              <div>
                <Label htmlFor="enabled">Overlay Enabled</Label>
                <Description>Hide or show the overlay globally.</Description>
              </div>
              <Button
                id="enabled"
                onPress={() => setSettings((current) => ({ ...current, enabled: !current.enabled }))}
                type="button"
                variant={settings.enabled ? "primary" : "outline"}
              >
                {settings.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <SettingsField
              description="How many seconds before the timestamp a comment appears."
              id="leadSeconds"
              label="Lead Seconds"
              max={30}
              min={0}
              onChange={updateNumeric}
              value={settings.leadSeconds}
            />
            <SettingsField
              description="How long a visible comment remains on screen."
              id="visibleSeconds"
              label="Visible Seconds"
              max={30}
              min={3}
              onChange={updateNumeric}
              value={settings.visibleSeconds}
            />
            <SettingsField
              description="Maximum YouTube API pages to fetch per video."
              id="maxPages"
              label="Max Pages"
              max={20}
              min={1}
              onChange={updateNumeric}
              value={settings.maxPages}
            />
            <SettingsField
              description="Long comments are trimmed to this length."
              id="maxCommentLength"
              label="Max Comment Length"
              max={500}
              min={60}
              onChange={updateNumeric}
              value={settings.maxCommentLength}
            />
          </Card.Content>
          <Card.Footer className="actions">
            <div className={`status status-${status.tone}`} role="status">
              {status.message}
            </div>
            <div className="button-row">
              <Button onPress={handleReset} type="button" variant="outline">
                <RotateCcw size={16} />
                Reset
              </Button>
              <Button isDisabled={isLoading} type="submit" variant="primary">
                <Save size={16} />
                Save
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </form>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<OptionsApp />);
}
