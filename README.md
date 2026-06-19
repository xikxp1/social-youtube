# Social Youtube

Chrome Manifest V3 extension that shows YouTube comments containing exactly one valid timestamp as a compact chat-style overlay in the bottom-left of the video.

## Development

```bash
bun install
bun test
bun run build
```

## Load In Chrome

1. Run `bun run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select `/Users/xikxp1/Projects/social-youtube/dist`.
6. Open the extension options page and add a YouTube Data API key.

The extension fetches top-level comments through the YouTube Data API when a video loads, parses timestamp text client-side, and never reads comments from the YouTube page DOM.
