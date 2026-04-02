export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch URL: ${response.statusText}` });
    }

    const html = await response.text();

    // Extract social media links before stripping HTML
    const socialLinks = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]+>/g, "").trim();
      if (
        href.includes("twitter.com/") ||
        href.includes("x.com/") ||
        href.includes("linkedin.com/")
      ) {
        socialLinks.push({ url: href, text });
      }
    }

    // Build a social profiles summary
    let socialSummary = "";
    if (socialLinks.length > 0) {
      socialSummary = "\n\n--- SOCIAL PROFILES FOUND ON PAGE ---\n";
      socialLinks.forEach(({ url, text }) => {
        if (url.includes("twitter.com/") || url.includes("x.com/")) {
          const handle = url.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/)?.[1];
          if (handle && handle !== "share" && handle !== "intent" && handle !== "home") {
            socialSummary += `X/Twitter: @${handle.replace(/^@/, "")} ${text ? `(${text})` : ""}\n`;
          }
        } else if (url.includes("linkedin.com/")) {
          const linkedinPath = url.match(/linkedin\.com\/(?:in|company)\/([\w-]+)/)?.[1];
          if (linkedinPath) {
            const type = url.includes("/company/") ? "Company" : "Person";
            socialSummary += `LinkedIn ${type}: ${url} ${text ? `(${text})` : ""}\n`;
          }
        }
      });
    }

    // Strip scripts, styles, and HTML tags to get clean text
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    res.status(200).json({ text: cleaned + socialSummary });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch URL: ${error.message}` });
  }
}
