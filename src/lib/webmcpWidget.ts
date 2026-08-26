// WebMCP fallback bridge — when document.modelContext is absent (plain Chrome,
// Safari, mobile), inject the open-source WebMCP widget so ANY MCP client
// (Claude Desktop, Cursor, etc.) can still connect and call our tools.

declare global {
  interface Window {
    webmcp?: {
      registerTool: (
        name: string,
        description: string,
        inputSchema: Record<string, unknown>,
        execute: (args: any) => unknown,
      ) => void;
    };
  }
}

const WIDGET_SRC = "https://cdn.jsdelivr.net/npm/@jason.today/webmcp@latest/webmcp.js";

let injected = false;

/** Load the fallback widget once. Resolves when the script is on the page. */
export function ensureWidget(): Promise<void> {
  if (injected) return Promise.resolve();
  injected = true;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("webmcp widget failed to load"));
    document.head.appendChild(s);
  });
}
