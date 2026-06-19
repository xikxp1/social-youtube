import { createRoot, type Root } from "react-dom/client";
import { OverlayApp } from "./OverlayApp";
import { overlayStyles } from "./overlayStyles";

const HOST_ID = "social-youtube-root";

let root: Root | null = null;
let mountedHost: HTMLElement | null = null;
let mountedVideoId = "";
let mountedVideo: HTMLVideoElement | null = null;
let mountTimer: number | null = null;

function getVideoId(): string | null {
  const url = new URL(window.location.href);
  return url.pathname === "/watch" ? url.searchParams.get("v") : null;
}

function findPlayer(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("#movie_player") ??
    document.querySelector<HTMLElement>(".html5-video-player")
  );
}

function findVideo(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>("video.html5-main-video") ?? document.querySelector("video");
}

function ensureHost(player: HTMLElement): HTMLElement {
  const existing = player.querySelector<HTMLElement>(`#${HOST_ID}`);
  if (existing) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "absolute";
  host.style.inset = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";

  const playerPosition = window.getComputedStyle(player).position;
  if (playerPosition === "static") {
    player.style.position = "relative";
  }

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = overlayStyles;
  shadowRoot.append(style);

  const appRoot = document.createElement("div");
  shadowRoot.append(appRoot);
  player.append(host);

  return host;
}

function mountOverlay(): void {
  const videoId = getVideoId();
  const player = findPlayer();
  const video = findVideo();

  if (!videoId || !player || !video) {
    root?.unmount();
    root = null;
    mountedHost = null;
    mountedVideoId = "";
    mountedVideo = null;
    return;
  }

  if (mountedVideoId === videoId && mountedVideo === video && root) {
    return;
  }

  const host = ensureHost(player);
  const appRoot = host.shadowRoot?.querySelector("div");
  if (!appRoot) {
    return;
  }

  if (!root || mountedHost !== host) {
    root?.unmount();
    root = createRoot(appRoot);
    mountedHost = host;
  }

  mountedVideoId = videoId;
  mountedVideo = video;
  root.render(<OverlayApp key={videoId} video={video} videoId={videoId} />);
}

function scheduleMount(): void {
  if (mountTimer) {
    window.clearTimeout(mountTimer);
  }

  mountTimer = window.setTimeout(() => {
    mountTimer = null;
    mountOverlay();
  }, 250);
}

const observer = new MutationObserver(scheduleMount);
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("yt-navigate-finish", scheduleMount);
window.addEventListener("popstate", scheduleMount);
scheduleMount();
