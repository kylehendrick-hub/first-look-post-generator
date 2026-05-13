import { useState, useRef, useCallback } from "react";
import Head from "next/head";

function linkifyOutput(text) {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Convert @handles to X/Twitter links
  html = html.replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" rel="noopener noreferrer">@$1</a>');
  // Convert URLs to clickable links (but skip ones already inside href="...")
  html = html.replace(/(^|[^"'])(https?:\/\/[^\s,|<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  return html;
}

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
- "Appreciate the time"
- Any corporate filler or throat-clearing openers

BANNED WORDS — replace with plain English:
- "revolutionary" / "cutting-edge" / "game-changing" / "disruptive" / "innovative"
- "Early Feasibility Study" → "testing it in patients"
- "cognitive signals" → "how hard you're thinking"
- "therapeutic playbook" → "treatment"
- "innovation ecosystem" → "startups"
- "regulatory friction" → "red tape"
- "capital formation" → "raising money"
- "workforce pipelines" → "hiring"
- "prominent venture capitalists" → "biggest baddest VCs"
- "bacteriophage" → "a virus that kills bacteria"
- "autonomous systems" → say what it actually does, e.g. "drones that fly themselves"
- ANY scientific, medical, or technical term that a normal person wouldn't use in conversation — translate it. If a word has more than 3 syllables and isn't commonly used, find a simpler way to say it.
- Your mom should be able to read every word and understand it. If she'd ask "what does that mean?" — rewrite it.

JOSH'S VOICE — how he actually writes:
- Questions as hooks: "Imagine if...?" / "Who do I know that...?"
- Short and punchy, but USE ENOUGH WORDS to actually explain what the company does. Don't be so short that you lose the meaning. 1-3 sentences is fine per company. The goal is clarity, not brevity for its own sake.
- Before/After contrasts and patterns: "First SpaceX in Bastrop, then X-Bow in Luling, now @Creative3DTech in Cedar Park."
- Transformation stories: "Was X, now doing Y" is inherently interesting. One sentence, instant narrative.
- Uses "Texas" not "Central Texas", "builders" not "entrepreneurs"
- Specific > Generic. Names, numbers, real details. If you could swap in any other company name and the sentence still works, it's too generic.
- Say what they ACTUALLY DO, not a category. BAD: "builds medical tech to keep humans healthy in space." GOOD: "is building a portable blood testing device for astronauts — and it works in ERs too." The reader should be able to picture the product.
- No em dashes. No hype. No jargon.
- Less "We" — more "You". Frame posts around the reader, not Capital Factory. Ask "Who is this post for?" and write to that person.
- One thought per tweet. Don't cram multiple ideas into one entry.

LEAD WITH ATTENTION, NOT CONTEXT:
The first sentence is everything. Don't start with what happened — start with why anyone should care.
- Framework: Hook → Facts → Call to action. NOT: Context → Description → Generic closer.
- BAD: "Kicking off CFHouse strong with Cup of Capital. Coffee, founders, investors and operators all packed into one room."
- GOOD: "Who do you need to meet? Cup of Capital is every morning at 9 AM during SXSW. Come find cofounders, collaborators, and investors."

BEFORE/AFTER EXAMPLES — study these patterns:

BAD: "Big move for advanced manufacturing in Central Texas. Congrats to @Creative3DTech on relocating HQ & manufacturing to Cedar Park."
GOOD: "It's too hard in California. First SpaceX in Bastrop, then X-Bow in Luling, now @Creative3DTech in Cedar Park."

BAD: "One small step for man. One giant leap for how humans interact with technology. Consumer neurotech is here."
GOOD: "Imagine if your computer knew how hard you were thinking? Neurable is working with HP and HyperX to make headphones for gamers that help to manage stress and focus."

BAD: "They've just launched their Early Feasibility Study to test it in patients. It could reshape how chronic inflammation is treated."
GOOD: "Imagine treating rheumatoid arthritis without drugs and their side effects? Surf is using ultrasound to heal the nervous system and is just starting to test it in patients."

BAD: "Built in a category most people think is broken."
GOOD: "Everyone knows the news business is broken, but they are making it work."

BAD: "We're evaluating a company building deployable, containerized SMRs using LEU fuel and helium cooling."
GOOD: "We sure are doing a lot more investments in nuclear fission and fusion. Who do I know that knows a lot about small nuclear reactors?"

BAD: "@capitalfactory is proud to be investors and honored to be in Midland, TX for their ribbon cutting."
GOOD: "@element3 is the first to pull lithium out of oil & gas waste-water and now Midland, TX has the first commercial lithium carbonate plant in the U.S."

BAD: "We started STATION DC to bring builders and policymakers into the same room... We're building the future of American innovation..."
GOOD: "STATION DC is bringing together the innovators and policymakers in DC — are you on the list?"

BAD: "#SkyboundMedtech builds medical tech to keep humans healthy in space — while creating defense and clinical applications back on Earth."
GOOD: "Astronauts can't go to a hospital. #SkyboundMedtech is building [specific device/tech] so doctors can [specific thing] from mission control."
NOTE: "builds medical tech" tells the reader NOTHING. What is the tech? What does it do? Be concrete. The reader should be able to picture the actual product.

SELF-CHECK — run this on EVERY company entry before including it:
1. Fluff detection: Any "proud," "excited," "honored," "great to," "looking forward"? Kill it.
2. Length: Use 1-3 sentences. Enough to explain what they do, not so much it's a paragraph.
3. Jargon: Read every single word. Would a normal person at a bar understand it? "Bacteriophage," "autonomous systems," "modular platform" — NO. Translate to plain English. No exceptions.
4. Opening: Does it hook or bore? If it starts with context/description, flip to a question or bold statement.
5. Specificity: Could you swap in any other company name and it still works? If yes, you haven't said what they actually DO. Name the product, the tech, the thing you can picture. "Builds medical tech" = FAIL. "Built a handheld scanner that detects infections in 10 minutes" = PASS.
6. The Picture Test: Can the reader picture what this company makes or does after reading your sentence? If not, rewrite until they can.
7. Tags: All relevant people and orgs tagged?
8. Voice: Would Josh say this out loud? If it sounds like a press release, rewrite.

CRITICAL RULES:
- NEVER ask for more information. NEVER refuse. Generate posts for whatever companies are provided, even if info is limited.
- If you only have a company name, write something based on what you can infer.
- Lead with a hook — a question, a bold statement, the problem they solve, or a wow factor. NEVER lead with context or description.
- 1-3 sentences per company. Use enough words to actually explain what they do so the reader gets it. Don't sacrifice clarity for brevity.
- Tag aggressively — every tag is an amplification opportunity. The person/company you tag might reshare.
- End with an engagement hook — give people a reason to respond.
- Would the person/company you're posting about want to repost this? If not, rewrite it.

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

🧬 What if your kid had a rare genetic disease and there was no drug for it? #AlphaRoseTheraputics builds a custom genetic medicine for that specific child.
👉 alpharose.com

🦾 10 million people are missing a hand. @AltBionics makes a bionic hand that costs a fraction of what's out there and actually works like a real one.
👉 altbionics.com

🛩️ Birds don't flap the whole time. They ride the wind. #AmericanTenet built drones that do the same thing and fly 3x longer on the same battery.
👉 americantenet.com

🤖 Ultrasound techs burn out fast. #ApricityRobotics built a robot arm that does the scan so the doctor can read it from anywhere.
👉 apricity.ai

🏎️ How do you test self-driving tech at 180 mph? @Code19Racing races autonomous cars on real tracks.
👉 code19.ai

🛡️ Small businesses get hacked all the time and can't afford a security team. @cytexsmb handles cybersecurity and compliance for them in one tool.
👉 cytex.io

💳 $150B sits in HSA and FSA accounts that people forget to use. #Gale lets you spend it at checkout like a normal credit card.
👉 withgale.com

🧒 40 million kids in the US are on Medicaid. Most can't find a therapist who takes it. #HealthyYoungMinds does online therapy and actually accepts Medicaid.
👉 healthyyoungminds.com

🧹 You run an Airbnb. Guest checks out at 11, next one arrives at 3. @UseKeepers finds you a vetted housekeeper in your area on demand.
👉 usekeepers.com

🩸 @molecularyou tests 250+ things in your blood and tells you exactly what to eat, how to train, and what to watch out for.
👉 molecularyou.com

🏃 What if your running app could tap you on the wrist to fix your form mid-stride? #Stride does that with haptic feedback while you run.

Which one is your favorite? Who do you know that one of these entrepreneurs needs to meet?

KEY PATTERNS from this example — FOLLOW THESE EXACTLY:
- Lead with the PROBLEM or a QUESTION, then say how the company solves it. Never start with "[Company] does X."
- Each company gets ONE emoji + a hook/problem + what they do + domain on next line with 👉
- Blank line between each company block
- Use @handle if the company has a known Twitter handle, otherwise #CompanyName
- Plain English ONLY. If your mom wouldn't say it, rewrite it.
- Include specific numbers when available ("250+", "$150B", "40M kids")
- The reader should be able to PICTURE what this company does. "builds medical tech" = FAIL. "built a robot arm that does ultrasound scans" = PASS.
- NEVER start an entry with "#CompanyName does..." or "#CompanyName builds..." — start with the problem, the question, or the surprising fact. THEN name the company.

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

    // Step 2: Ask Claude to look up social profiles
    addLog("Looking up social profiles via Claude...");
    try {
      const lookupRes = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are a research assistant. Given information about startup companies, identify their X/Twitter handles and LinkedIn company page URLs, plus founder names and their X/Twitter handles and LinkedIn profile URLs.

IMPORTANT RULES:
- Only return handles/URLs you are confident are correct. If unsure, leave the field as null.
- For X/Twitter, return the handle with @ prefix (e.g. "@companyname")
- For LinkedIn, return the full URL (e.g. "https://www.linkedin.com/company/companyname" or "https://www.linkedin.com/in/foundername")
- Return valid JSON only, no other text.

Return a JSON array with this structure:
[
  {
    "company": "Company Name",
    "twitter": "@handle or null",
    "linkedin": "https://linkedin.com/company/... or null",
    "founder": "Founder Name or null",
    "founder_twitter": "@handle or null",
    "founder_linkedin": "https://linkedin.com/in/... or null"
  }
]`,
          messages: [
            {
              role: "user",
              content: `Find X/Twitter handles and LinkedIn URLs for these companies and their founders. Return JSON only.\n\n${inputText}`,
            },
          ],
        }),
      });
      const lookupData = await lookupRes.json();
      if (lookupRes.ok) {
        const lookupText = lookupData.content?.[0]?.text || "";
        // Extract JSON from response
        const jsonMatch = lookupText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const profiles = JSON.parse(jsonMatch[0]);
            inputText += "\n\n--- SOCIAL PROFILES (use these for tagging) ---\n";
            profiles.forEach((p) => {
              inputText += `\nCOMPANY: ${p.company}\n`;
              if (p.twitter) inputText += `  Company X/Twitter: ${p.twitter}\n`;
              if (p.linkedin) inputText += `  Company LinkedIn: ${p.linkedin}\n`;
              if (p.founder) inputText += `  Founder: ${p.founder}\n`;
              if (p.founder_twitter) inputText += `  Founder X/Twitter: ${p.founder_twitter}\n`;
              if (p.founder_linkedin) inputText += `  Founder LinkedIn: ${p.founder_linkedin}\n`;
            });
            const found = profiles.filter((p) => p.twitter || p.linkedin).length;
            addLog(`Found social profiles for ${found}/${profiles.length} companies`, "success");
          } catch (e) {
            addLog("Could not parse social profile lookup", "error");
          }
        }
      }
    } catch (err) {
      addLog(`Social lookup failed (continuing without): ${err.message}`, "error");
    }

    // Step 3: Send to Claude to generate posts
    addLog("Generating posts via Claude...");
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is information about the companies presenting at this month's Capital Factory First Look, including their social profiles where available. Generate X/Twitter and LinkedIn posts for ALL companies listed. USE the social profiles provided to tag companies and founders correctly.\n\n${inputText}`,
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
              {currentOutput ? (
                <div dangerouslySetInnerHTML={{ __html: linkifyOutput(currentOutput) }} />
              ) : (
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
