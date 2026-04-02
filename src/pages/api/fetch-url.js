export const config = {
  maxDuration: 60,
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return "";
  return await res.text();
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
    if (!socials.twitter && (href.includes("twitter.com/") || href.includes("x.com/"))) {
      const handle = href.match(/(?:twitter\.com|x\.com)\/([@\w]+)/)?.[1];
      if (handle && !["share", "intent", "home", "search", "login", "signup"].includes(handle)) {
        socials.twitter = "@" + handle.replace(/^@/, "");
      }
    }
    if (!socials.linkedin && href.includes("linkedin.com/")) {
      const linkedinMatch = href.match(/linkedin\.com\/(in|company)\/([\w-]+)/);
      if (linkedinMatch) {
        socials.linkedin = href.split("?")[0];
      }
    }
  }
  return socials;
}

function extractCompanyWebsites(html) {
  // Look for external website links (not pitch.vc internal links)
  const websites = [];
  const linkRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
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
      !href.includes("facebook.com")
    ) {
      websites.push(href);
    }
  }
  return websites;
}

async function searchSocialProfiles(companyName) {
  // Use Google search to find social profiles
  const socials = { twitter: null, linkedin: null };

  try {
    // Search for X/Twitter profile
    const twitterQuery = encodeURIComponent(`${companyName} site:x.com OR site:twitter.com`);
    const twitterHtml = await fetchPage(`https://www.google.com/search?q=${twitterQuery}&num=3`);
    const twitterMatch = twitterHtml.match(/(?:twitter\.com|x\.com)\/([@\w]+)/);
    if (twitterMatch) {
      const handle = twitterMatch[1];
      if (!["share", "intent", "home", "search", "login", "signup", "hashtag"].includes(handle)) {
        socials.twitter = "@" + handle.replace(/^@/, "");
      }
    }
  } catch (e) {}

  try {
    // Search for LinkedIn company profile
    const linkedinQuery = encodeURIComponent(`${companyName} site:linkedin.com/company`);
    const linkedinHtml = await fetchPage(`https://www.google.com/search?q=${linkedinQuery}&num=3`);
    const linkedinMatch = linkedinHtml.match(/linkedin\.com\/company\/([\w-]+)/);
    if (linkedinMatch) {
      socials.linkedin = `https://www.linkedin.com/company/${linkedinMatch[1]}`;
    }
  } catch (e) {}

  return socials;
}

async function searchFounderProfiles(founderName, companyName) {
  const socials = { twitter: null, linkedin: null };

  try {
    const twitterQuery = encodeURIComponent(`"${founderName}" ${companyName} site:x.com OR site:twitter.com`);
    const twitterHtml = await fetchPage(`https://www.google.com/search?q=${twitterQuery}&num=3`);
    const twitterMatch = twitterHtml.match(/(?:twitter\.com|x\.com)\/([@\w]+)/);
    if (twitterMatch) {
      const handle = twitterMatch[1];
      if (!["share", "intent", "home", "search", "login", "signup", "hashtag"].includes(handle)) {
        socials.twitter = "@" + handle.replace(/^@/, "");
      }
    }
  } catch (e) {}

  try {
    const linkedinQuery = encodeURIComponent(`"${founderName}" ${companyName} site:linkedin.com/in`);
    const linkedinHtml = await fetchPage(`https://www.google.com/search?q=${linkedinQuery}&num=3`);
    const linkedinMatch = linkedinHtml.match(/linkedin\.com\/in\/([\w-]+)/);
    if (linkedinMatch) {
      socials.linkedin = `https://www.linkedin.com/in/${linkedinMatch[1]}`;
    }
  } catch (e) {}

  return socials;
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

    // Check if this is a pitch.vc list page — extract company profile links
    const isPitchVcList = url.includes("pitch.vc/lists/");
    const isPitchVcCompany = url.includes("pitch.vc/companies/");
    const companies = [];

    if (isPitchVcList) {
      // Extract links to individual company profiles on pitch.vc
      const profileRegex = /<a[^>]+href=["'](\/companies\/[^"']+)["'][^>]*>/gi;
      const profileLinks = new Set();
      let m;
      while ((m = profileRegex.exec(html)) !== null) {
        const path = m[1];
        if (!path.includes("filter")) {
          profileLinks.add("https://pitch.vc" + path);
        }
      }

      // Fetch each company profile page in parallel
      const profileResults = await Promise.all(
        [...profileLinks].map(async (profileUrl) => {
          const profileHtml = await fetchPage(profileUrl);
          if (!profileHtml) return null;

          const profileText = stripHtml(profileHtml);

          // Extract company name from the page
          const nameMatch = profileHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          const companyName = nameMatch
            ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
            : "";

          // Extract founder name — look for "Founder" label nearby
          const founderMatch = profileText.match(
            /(?:founder|ceo|co-founder)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i
          );
          const founderName = founderMatch ? founderMatch[1] : "";

          // Extract website from profile page
          const websites = extractCompanyWebsites(profileHtml);
          let companySocials = { twitter: null, linkedin: null };

          // Try to get social links from company website
          if (websites.length > 0) {
            const siteHtml = await fetchPage(websites[0]);
            if (siteHtml) {
              companySocials = extractSocialLinks(siteHtml);
            }
          }

          // If we still don't have socials, search Google
          if (companyName && (!companySocials.twitter || !companySocials.linkedin)) {
            const searched = await searchSocialProfiles(companyName);
            if (!companySocials.twitter && searched.twitter)
              companySocials.twitter = searched.twitter;
            if (!companySocials.linkedin && searched.linkedin)
              companySocials.linkedin = searched.linkedin;
          }

          // Search for founder profiles
          let founderSocials = { twitter: null, linkedin: null };
          if (founderName && companyName) {
            founderSocials = await searchFounderProfiles(founderName, companyName);
          }

          return {
            name: companyName,
            description: profileText.slice(0, 1500),
            website: websites[0] || "",
            founder: founderName,
            socials: companySocials,
            founderSocials,
          };
        })
      );

      companies.push(...profileResults.filter(Boolean));
    } else if (isPitchVcCompany) {
      // Single company page
      const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const companyName = nameMatch
        ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
        : "";
      const founderMatch = mainText.match(
        /(?:founder|ceo|co-founder)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i
      );
      const founderName = founderMatch ? founderMatch[1] : "";
      const websites = extractCompanyWebsites(html);
      let companySocials = { twitter: null, linkedin: null };

      if (websites.length > 0) {
        const siteHtml = await fetchPage(websites[0]);
        if (siteHtml) companySocials = extractSocialLinks(siteHtml);
      }

      if (companyName && (!companySocials.twitter || !companySocials.linkedin)) {
        const searched = await searchSocialProfiles(companyName);
        if (!companySocials.twitter) companySocials.twitter = searched.twitter;
        if (!companySocials.linkedin) companySocials.linkedin = searched.linkedin;
      }

      let founderSocials = { twitter: null, linkedin: null };
      if (founderName && companyName) {
        founderSocials = await searchFounderProfiles(founderName, companyName);
      }

      companies.push({
        name: companyName,
        description: mainText.slice(0, 1500),
        website: websites[0] || "",
        founder: founderName,
        socials: companySocials,
        founderSocials,
      });
    }

    // Build enriched output
    let output = mainText;

    if (companies.length > 0) {
      output += "\n\n--- ENRICHED COMPANY DATA ---\n";
      companies.forEach((c) => {
        output += `\nCOMPANY: ${c.name}\n`;
        if (c.website) output += `  Website: ${c.website}\n`;
        if (c.founder) output += `  Founder: ${c.founder}\n`;
        if (c.socials.twitter) output += `  Company X/Twitter: ${c.socials.twitter}\n`;
        if (c.socials.linkedin)
          output += `  Company LinkedIn: ${c.socials.linkedin}\n`;
        if (c.founderSocials.twitter)
          output += `  Founder X/Twitter: ${c.founderSocials.twitter}\n`;
        if (c.founderSocials.linkedin)
          output += `  Founder LinkedIn: ${c.founderSocials.linkedin}\n`;
        if (c.description)
          output += `  Description: ${c.description.slice(0, 500)}\n`;
      });
    }

    res.status(200).json({ text: output });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch URL: ${error.message}` });
  }
}
