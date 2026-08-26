import { useState } from "react";

interface Props {
  onConnected: () => void;
}

export function ConnectModal({ onConnected }: Props) {
  const [copied, setCopied] = useState(false);

  const mcpConfig = `{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["-y", "@jason.today/webmcp@0.1.13", "--mcp"]
    }
  }
}`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onConnected}>
      <div className="max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl">Bring your coach online</h3>
        <p className="mt-2 text-sm text-stone-600">
          Gym & Tonic exposes its whole week as tools. You just need an MCP client to call them.
        </p>

        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="font-semibold">Option A — ChatGPT desktop (recommended)</p>
            <ol className="mt-1 list-inside list-decimal text-stone-600">
              <li>Open this page in <strong>ChatGPT desktop</strong> built-in browser</li>
              <li>Ask: <em>"Plan my week"</em> or <em>"What's missing?"</em></li>
              <li>It sees all tools automatically — no config needed.</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold">Option B — Claude Desktop / Cursor</p>
            <ol className="mt-1 list-inside list-decimal text-stone-600">
              <li>Install the WebMCP bridge locally:
                <button onClick={() => copy(mcpConfig)} className="ml-2 rounded bg-stone-100 px-2 py-1 text-xs hover:bg-stone-200">{copied ? "Copied!" : "Copy config"}</button>
              </li>
              <li>Paste into your MCP client config</li>
              <li>Restart the client, then ask it to <em>"connect to Gym & Tonic"</em></li>
            </ol>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">{mcpConfig}</pre>
          </div>

          <div>
            <p className="font-semibold">Option C — Copy a coach prompt</p>
            <button onClick={() => copy("I'm your training coach. Use the site tools on this page to plan my week, check what muscle groups are neglected, and propose sessions for me to approve.")} className="mt-1 rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
              {copied ? "Copied!" : "📋 Copy coach prompt"}
            </button>
            <p className="mt-1 text-xs text-stone-500">Paste into ChatGPT / Claude after opening the live page in their browser.</p>
          </div>
        </div>

        <button onClick={onConnected} className="mt-6 w-full rounded-lg border border-stone-300 py-2 text-sm hover:bg-stone-50">
          Got it — back to training
        </button>
      </div>
    </div>
  );
}
