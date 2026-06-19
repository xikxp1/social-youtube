export const overlayStyles = `
:host {
  all: initial;
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.ytc-root {
  position: absolute;
  left: clamp(12px, 2vw, 24px);
  bottom: clamp(72px, 12vh, 112px);
  z-index: 2147483647;
  width: min(420px, calc(100vw - 32px));
  max-width: 42%;
  pointer-events: none;
  color: #f8fafc;
}

.ytc-feed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-height: 300px;
  overflow: hidden;
}

.ytc-comment {
  width: fit-content;
  max-width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(12, 15, 20, 0.72);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
  will-change: opacity, transform;
}

.ytc-comment[data-state="entering"] {
  animation: ytc-in 220ms ease-out both;
}

.ytc-comment[data-state="leaving"] {
  pointer-events: none;
  animation: ytc-out 450ms ease-in both;
}

.ytc-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  margin-bottom: 3px;
  font-size: 11px;
  line-height: 1.2;
  color: rgba(226, 232, 240, 0.76);
}

.ytc-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}

.ytc-time {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  color: rgba(148, 163, 184, 0.95);
}

.ytc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: 13px;
  line-height: 1.35;
  color: rgba(248, 250, 252, 0.96);
}

.ytc-status {
  max-width: 260px;
  width: fit-content;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 8px;
  padding: 7px 9px;
  background: rgba(12, 15, 20, 0.68);
  color: rgba(226, 232, 240, 0.74);
  font-size: 11px;
  line-height: 1.2;
  backdrop-filter: blur(12px);
}

@keyframes ytc-in {
  from {
    opacity: 0;
    transform: translate3d(-8px, 6px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes ytc-out {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(-6px, -4px, 0);
  }
}

@media (max-width: 900px) {
  .ytc-root {
    max-width: min(420px, calc(100vw - 32px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ytc-comment {
    animation: none;
    will-change: auto;
  }
}
`;
