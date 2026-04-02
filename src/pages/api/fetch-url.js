export const config = {
  maxDuration: 60,
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function stripHtml(html) {
  return html
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
}

function extractSocialLinks(html) {
  const socials = { twitter: null, linkedin: null };
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (
      !socials.twitter &&
      (href.includes("twitter.com/") || href.includes("x.com/"))
    ) {
      const handle = href.match(/(?:twitter\.com|x\.com)\/([@\w]+)/)?.[1];
      if (
        handle &&
        !["share", "intent", "home", "search", "login", "signup"].includes(
          handle
        )
      ) {
        socials.twitter = "@" + handle.replace(/^@/, "");
      }
    }
    if (!socials.linkedin && href.includes("linkedin.com/")) {
      const linkedinMatch = href.match(
        /linkedin\.com\/(in|company)\/([\w-]+)/
      );
      if (linkedinMatch) {
        socials.linkedin = href.split("?")[0];
      }
    }
  }
  return socials;
}

function extractFounderFromProfile(profileHtml) {
  // Pitch.vc structure: <a href="/people/name">PersonName<div>Founder</div></a>
  const founderBlockMatch = profileHtml.match(
    /<a[^>]+href=["']\/people\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i
  );
  if (!founderBlockMatch) return "";
  const blockText = founderBlockMatch[1].replace(/<[^>]+>/g, "\n").trim();
  const lines = blockText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (
      !/^(founder|ceo|co-founder|cto|coo)/i.test(line) &&
      /^[A-Z]/.test(line)
    ) {
      return line;
    }
  }
  return "";
}

function extractCompanyWebsite(html) {
  const linkRegex =
    /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (
      !href.includes("pitch.vc") &&
      !href.includes("capitalfactory.com") &&
      !href.includes("linktr.ee") &&
      !href.includes("google.com") &&
      !href.includes("linkedin.com") &&
      !href.includes("twitter.com") &&
      !href.includes("x.com") &&
      !href.includes("facebook.com") &&
      !href.includes("instagram.com")
    ) {
      return href;
    }
  }
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const html = await fetchPage(url);
    if (!html) {
      return res.status(502).json({ error: "Failed to fetch URL" });
    }

    const mainText = stripHtml(html);
    const isPitchVcList = url.includes("pitch.vc/lists/");
    const isPitchVcCompany = url.includes("pitch.vc/companies/");
    const companies = [];

    if (isPitchVcList || isPitchVcCompany) {
      // Get profile URLs to fetch
      let profileUrls = [];

      if (isPitchVcList) {
        const profileRegex =
          /<a[^>]+href=["']((?:https?:\/\/pitch\.vc)?\/companies\/[^"']+)["'][^>]*>/gi;
        const profileLinks = new Set();
        let m;
        while ((m = profileRegex.exec(html)) !== null) {
          let path = m[1];
          if (path.includes("filter")) continue;
          if (!path.startsWith("http")) path = "https://pitch.vc" + path;
          profileLinks.add(path);
        }
        profileUrls = [...profileLinks];
      } else {
        profileUrls = [url];
      }

      // Fetch each company profile page in parallel
      const profileResults = await Promise.all(
        profileUrls.map(async (profileUrl) => {
          const profileHtml = isPitchVcCompany
            ? html
            : await fetchPage(profileUrl);
          if (!profileHtml) return null;

          const profileText = stripHtml(profileHtml);
          const nameMatch = profileHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          const companyName = nameMatch
            ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
            : "";
          const founderName = extractFounderFromProfile(profileHtml);
          const website = extractCompanyWebsite(profileHtml);

          // Try to get social links from company website
          let socials = { twitter: null, linkedin: null };
          if (website) {
            const siteHtml = await fetchPage(website);
            if (siteHtml) {
              socials = extractSocialLinks(siteHtml);
            }
          }

          return {
            name: companyName,
            description: profileText.slice(0, 1000),
            website,
            founder: founderName,
            socials,
          };
        })
      );

      companies.push(...profileResults.filter(Boolean));
    }

    // Build output
    let output = mainText;

    if (companies.length > 0) {
      output += "\n\n--- COMPANY PROFILES FROM PITCH.VC ---\n";
      companies.forEach((c) => {
        output += `\nCOMPANY: ${c.name}\n`;
        if (c.website) output += `  Website: ${c.website}\n`;
        if (c.founder) output += `  Founder: ${c.founder}\n`;
        if (c.socials.twitter)
          output += `  Company X/Twitter: ${c.socials.twitter}\n`;
        if (c.socials.linkedin)
          output += `  Company LinkedIn: ${c.socials.linkedin}\n`;
        if (c.description)
          output += `  Description: ${c.description.slice(0, 500)}\n`;
      });
    }

    res.status(200).json({ text: output });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch URL: ${error.message}` });
  }
}
