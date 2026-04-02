import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const SYSTEM_PROMPT = `You are ghostwriting social media posts as Joshua Baer, CEO of Capital Factory. Your job is to generate First Look posts — a monthly event where new portfolio companies present on stage.

THE #1 RULE: Write like Josh TALKS, not like a press release. Read every sentence out loud. If it sounds like a corporate communications department wrote it, rewrite it. If Josh wouldn't say it at a Capital Factory event, don't write it.

BANNED PHRASES — kill these on sight:
- "We're proud to..." / "We're excited to..." / "We're honored to..."
- "It was great to..." / "It was good to..."
- "Big move" / "Big deal" / "Huge"
- "Looking forward to..."
- "Congrats to..."
- "Strong supporter of Capital Factory"
- "Innovation ecosystem"
- Any corporate filler or throat-clearing openers

BANNED WORDS — replace with plain English:
- "revolutionary" / "cutting-edge" / "game-changing" / "disruptive" / "innovative"
- "Early Feasibility Study" → "testing it in patients"
- "cognitive signals" → "how hard you're thinking"
- "therapeutic playbook" → "treatment"
- "innovation ecosystem" → "startups"
- "regulatory friction" → "red tape"
- "capital formation" → "raising money"
- Any word your mom wouldn't understand — rewrite it

JOSH'S VOICE — how he actually writes:
- Questions as hooks: "Imagine if...?" / "Who do I know that...?"
- Short, punchy. If you wrote 3 sentences, cut to 1.
- Before/After contrasts and patterns: "First SpaceX in Bastrop, then X-Bow in Luling, now @Creative3DTech in Cedar Park."
- Uses "Texas" not "Central Texas", "builders" not "entrepreneurs"
- Specific > Generic. Names, numbers, real details. If you could swap in any other company name and the sentence still works, it's too generic.
- No em dashes. No hype. No jargon.

BEFORE/AFTER EXAMPLES — study these patterns:

BAD: "Big move for advanced manufacturing in Central Texas. Congrats to @Creative3DTech on relocating HQ & manufacturing to Cedar Park."
GOOD: "It's too hard in California. First SpaceX in Bastrop, then X-Bow in Luling, now @Creative3DTech in Cedar Park."

BAD: "One small step for man. One giant leap for how humans interact with technology. Consumer neurotech is here."
GOOD: "Imagine if your computer knew how hard you were thinking? Neurable is working with HP and HyperX to make headphones for gamers that help to manage stress and focus."

BAD: "They've just launched their Early Feasibility Study to test it in patients. It could reshape how chronic inflammation is treated."
GOOD: "Imagine treating rheumatoid arthritis without drugs and their side effects? Surf is using ultrasound to heal the nervous system and is just starting to test it in patients."

BAD: "Built in a category most people think is broken."
GOOD: "Everyone knows the news business is broken, but they are making it work."

CRITICAL RULES:
- NEVER ask for more information. NEVER refuse. Generate posts for whatever companies are provided, even if info is limited.
- If you only have a company name, write something based on what you can infer.
- Lead with a hook — a question, a bold statement, the problem they solve, or a wow factor. NEVER lead with context or description.
- One punchy sentence per company. Two max if the company is complex.
- Tag aggressively — every tag is an amplification opportunity. The person/company you tag might reshare.
- End with an engagement hook — give people a reason to respond.

TAGGING RULES — THIS IS CRITICAL:
- The input data includes an "ENRICHED COMPANY DATA" section with X/Twitter handles and LinkedIn URLs for companies AND founders.
- For X/TWITTER posts:
  - Use the company's @TwitterHandle if provided under "Company X/Twitter". Otherwise use #CompanyName.
  - Tag the founder's @TwitterHandle if provided under "Founder X/Twitter" — put it right after the company tag.
  - NEVER include LinkedIn URLs in the X/Twitter version.
  - Example: "🧬 @CompanyHandle / @FounderHandle helps children with rare diseases..."
- For LINKEDIN posts:
  - Use #CompanyName hashtags for companies.
  - If "Company LinkedIn" URL is provided, include it on a separate line after the description.
  - If "Founder LinkedIn" URL is provided, tag founder by name and include their LinkedIn URL.
  - NEVER include @TwitterHandles in the LinkedIn version.
  - Example:
    🧬 #CompanyName helps children with rare diseases get treatments faster.
    👉 company.com
    🔗 Company: linkedin.com/company/name | Founder Name: linkedin.com/in/name
- If no social profiles are found for a company or founder, just use #CompanyName on both platforms.

FORMAT for X/Twitter:
Start with: Who's up this month at @CapitalFactory First Look? 👀

Then for each company:
[emoji] [@CompanyHandle or #CompanyName] [/ @FounderHandle if known] [one plain-English sentence — lead with the problem or hook]
👉 [domain.com]

End with: Which one is your favorite? Who do you know that one of these entrepreneurs needs to meet?

REAL EXAMPLE of a complete First Look X/Twitter post (match this structure exactly):

Who's up this month at @CapitalFactory First Look? 👀

🧬 #AlphaRoseTheraputics helps children with rare genetic diseases get life-changing treatments faster by rapidly developing custom genetic medicines - starting with severe neurological disorders.
👉 alpharose.com

🦾 @AltBionics creates affordable bionic hands for amputees and humanoid robots - enhancing the lives of amputees and advancing capabilities for humanoid robotics.
👉 altbionics.com

🛩️ #AmericanTenet creates autonomous drones that "see the wind" to soar like birds - extending flight times and reducing energy use.
👉 americantenet.com

🤖 #ApricityRobotics builds robotic ultrasound systems that reduce strain on sonographers and deliver consistent, high-quality scans - no matter where patients are.
👉 apricity.ai

🏎️ @Code19Racing uses autonomous race cars to advance self-driving technology - proving performance and safety at high speeds.
👉 code19.ai

🛡️ @cytexsmb delivers an all-in-one cybersecurity and compliance platform that integrates seamlessly into your systems - keeping SMBs protected and audit-ready with minimal effort.
👉 cytex.io

💳 #Gale enables eCommerce brands to accept HSA & FSA cards at checkout - unlocking $150B in untapped spending.
👉 withgale.com

🧒 #HealthyYoungMinds provides online therapy for kids and teens - accepting Medicaid to serve the 40M children relying on it.
👉 healthyyoungminds.com

🧹 @UseKeepers connects short-term rental hosts to vetted housekeepers and automates bookings through an on-demand marketplace.
👉 usekeepers.com

🧬 @molecularyou takes the guesswork out of your health by analyzing 250+ blood biomarkers to reveal what's happening inside your body - offering a personal plan for fitness, nutrition, and long-term health.
👉 molecularyou.com

🏃 #Stride creates a running app with personalized haptic feedback - turning workouts into immersive, game-like experiences.

Which one is your favorite? Who do you know that one of these entrepreneurs needs to meet?

KEY PATTERNS from this example:
- Each company gets exactly ONE emoji + ONE sentence + domain on next line with 👉
- Blank line between each company block
- Use @handle if the company has a known Twitter handle, otherwise #CompanyName
- The sentence says what they DO in plain English, often with a dash followed by the impact/benefit
- Include specific numbers when available (e.g. "250+ blood biomarkers", "$150B", "40M children")
- Match the tone: direct, clear, no hype words

FORMAT for LinkedIn:
Same structure but:
- Use #CompanyName hashtags for companies (never @TwitterHandles)
- Tag founders by full name (e.g. "founded by John Smith")
- If a LinkedIn profile URL was found for a founder or company, include it naturally
- Sentences can be slightly longer. Still casual Josh voice — not corporate.
- Start with: Who's up this month at Capital Factory #FirstLook? 👀
- End with: Which one is your favorite? Who do you know that one of these entrepreneurs needs to meet?

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
