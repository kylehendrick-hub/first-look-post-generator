import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const SYSTEM_PROMPT = `You are ghostwriting social media posts as Joshua Baer, CEO of Capital Factory. You write like Josh TALKS — casual, direct, founder-to-founder.

RULES:
- NEVER use these phrases: "We're proud to", "We're excited to", "We're honored to", "Big move", "Looking forward", "Congrats", "Strong supporter"
- No jargon. No fluff. Plain English only. No hype words like "revolutionary", "cutting-edge", "game-changing", "disruptive", "innovative"
- Lead with the PROBLEM they solve or the wow factor
- One punchy sentence per company
- NEVER ask for more information. NEVER refuse. Generate posts for whatever companies are provided, even if info is limited.
- If you only have a company name, write something based on what you can infer

FORMAT for X/Twitter:
Start with: Who's up this month at @CapitalFactory First Look? 👀

Then for each company:
[emoji] [#CompanyName or @CompanyHandle] [one plain-English sentence about what they do, leading with the problem or wow factor]
👉 [domain.com]

End with: Which one is your favorite? Who do you know that one of these entrepreneurs needs to meet?

FORMAT for LinkedIn:
Same structure but use #CompanyName hashtags (not @handles), sentences can be slightly longer and more descriptive. Still casual Josh voice.

Generate BOTH versions. Separate them with "---LINKEDIN---" on its own line. Put the X/Twitter version first.`;

export default function Home() {
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [twitterOutput, setTwitterOutput] = useState("");
  const [linkedinOutput, setLinkedinOutput] = useState("");
  const [activeTab, setActiveTab] = useState("twitter");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev,
    ]);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    addLog(`File selected: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target.result);
      addLog(`File loaded (${(file.size / 1024).toFixed(1)} KB)`, "success");
    };
    reader.onerror = () => addLog("Failed to read file", "error");
    reader.readAsText(file);
  };

  const generate = async () => {
    setLoading(true);
    setTwitterOutput("");
    setLinkedinOutput("");
    setCopied(false);

    let inputText = "";

    // Step 1: Gather input
    if (url.trim()) {
      addLog(`Fetching ${url}...`);
      try {
        const res = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        inputText += data.text + "\n\n";
        addLog(`Fetched page content (${data.text.length} chars)`, "success");
      } catch (err) {
        addLog(`URL fetch failed: ${err.message}`, "error");
        setLoading(false);
        return;
      }
    }

    if (fileContent) {
      inputText += fileContent + "\n\n";
      addLog("Added file content to input");
    }

    if (manualText.trim()) {
      inputText += manualText.trim() + "\n\n";
      addLog("Added pasted text to input");
    }

    if (!inputText.trim()) {
      addLog("No input provided — enter a URL, upload a file, or paste text", "error");
      setLoading(false);
      return;
    }

    // Step 2: Send to Claude
    addLog("Sending to Claude API...");
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is information about the companies presenting at this month's Capital Factory First Look. Generate X/Twitter and LinkedIn posts for ALL companies listed.\n\n${inputText}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const fullText = data.content?.[0]?.text || "";

      // Split into Twitter and LinkedIn versions
      const parts = fullText.split(/---\s*LINKEDIN\s*---/i);
      setTwitterOutput(parts[0]?.trim() || fullText.trim());
      setLinkedinOutput(parts[1]?.trim() || parts[0]?.trim() || fullText.trim());

      addLog("Posts generated successfully!", "success");
    } catch (err) {
      addLog(`Claude API error: ${err.message}`, "error");
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    const text = activeTab === "twitter" ? twitterOutput : linkedinOutput;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    addLog(`Copied ${activeTab === "twitter" ? "X/Twitter" : "LinkedIn"} post to clipboard`, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentOutput = activeTab === "twitter" ? twitterOutput : linkedinOutput;

  return (
    <>
      <Head>
        <title>First Look Post Generator — Capital Factory</title>
      </Head>

      <div className="app">
        <main className="main">
          <div className="header">
            <h1>
              First Look <span>Post Generator</span>
            </h1>
            <p>Generate Josh-style social posts for Capital Factory First Look companies</p>
          </div>

          {/* URL Input */}
          <div className="input-section">
            <label>Pitch.vc URL</label>
            <div className="url-row">
              <input
                type="url"
                className="url-input"
                placeholder="https://pitch.vc/lists/april-2026-first-look"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
              />
              <button className="btn" onClick={generate} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </div>

          {/* File + Text Input */}
          <div className="input-section">
            <label>Or upload / paste company info</label>
            <div className="file-upload">
              <button
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload PDF / Word / TXT
              </button>
              {fileName && <span className="file-name">{fileName}</span>}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <textarea
                className="textarea"
                placeholder="Paste company names, descriptions, or any text about the presenting companies..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>
          </div>

          {/* Output */}
          <div className="output-section">
            <div className="output-header">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "twitter" ? "active" : ""}`}
                  onClick={() => { setActiveTab("twitter"); setCopied(false); }}
                >
                  X / Twitter
                </button>
                <button
                  className={`tab ${activeTab === "linkedin" ? "active" : ""}`}
                  onClick={() => { setActiveTab("linkedin"); setCopied(false); }}
                >
                  LinkedIn
                </button>
              </div>
              <div className="output-actions">
                <button
                  className={`btn btn-sm btn-outline ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                  disabled={!currentOutput}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={generate}
                  disabled={loading || (!url && !fileContent && !manualText)}
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div className="output-content">
              {currentOutput || (
                <div className="output-placeholder">
                  {loading
                    ? "Generating posts..."
                    : "Generated posts will appear here. Enter a URL, upload a file, or paste text to get started."}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Activity Log Sidebar */}
        <aside className="sidebar">
          <h2>Activity Log</h2>
          {logs.length === 0 && (
            <div className="log-entry">
              <div className="log-msg">Waiting for input...</div>
            </div>
          )}
          {logs.map((log, i) => (
            <div className="log-entry" key={i}>
              <div className="log-time">{log.time}</div>
              <div className={`log-msg ${log.type}`}>{log.msg}</div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
