# Social Youtube

Chrome extension that shows YouTube comments as a compact chat-style overlay in the bottom-left of the video.

## Development

```bash
bun install
bun test
bun run build
```

The extension fetches top-level comments through the YouTube Data API when a video loads, parses timestamp text client-side and displays them as a compact chat-style overlay in the bottom-left of the video.
