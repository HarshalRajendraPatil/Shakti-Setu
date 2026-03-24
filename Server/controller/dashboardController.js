// Server-side Gemini call for dashboard insights (top 10 problems + top 10 rights with links)
const { GoogleGenAI } = require("@google/genai");

const LINK_TIMEOUT_MS = 5000;
const LINK_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const linkHealthCache = new Map();

const DEFAULT_PROBLEM_LINKS = [
  "https://nalsa.gov.in/",
  "https://india.gov.in/",
  "https://www.legalserviceindia.com/",
  "https://lawrato.com/",
];

const DEFAULT_RIGHTS_LINKS = [
  "https://nalsa.gov.in/",
  "https://india.gov.in/",
  "https://www.legalserviceindia.com/",
  "https://lawrato.com/",
];

const KEYWORD_LINK_RULES = [
  {
    keywords: ["domestic violence", "violence", "abuse", "harassment", "dowry"],
    links: ["https://www.ncw.nic.in/", "https://nalsa.gov.in/"],
  },
  {
    keywords: ["property", "inheritance", "succession", "asset", "land"],
    links: ["https://www.legalserviceindia.com/", "https://india.gov.in/"],
  },
  {
    keywords: ["marriage", "divorce", "maintenance", "family", "custody"],
    links: ["https://lawrato.com/", "https://nalsa.gov.in/"],
  },
  {
    keywords: ["workplace", "employment", "maternity", "salary", "equal pay"],
    links: ["https://labour.gov.in/", "https://lawrato.com/"],
  },
  {
    keywords: ["police", "fir", "crime", "complaint", "sexual assault"],
    links: ["https://www.mha.gov.in/", "https://nalsa.gov.in/"],
  },
  {
    keywords: ["cyber", "online", "internet", "digital", "fraud"],
    links: ["https://cybercrime.gov.in/", "https://www.legalserviceindia.com/"],
  },
  {
    keywords: ["free legal aid", "legal aid", "help", "support"],
    links: ["https://nalsa.gov.in/", "https://www.ncw.nic.in/"],
  },
];

const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (url, options = {}, timeout = LINK_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isReachable = async (url) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  const cached = linkHealthCache.get(normalized);
  if (cached && Date.now() - cached.checkedAt < LINK_CACHE_TTL_MS) {
    return cached.ok;
  }

  let ok = false;
  try {
    const headResponse = await fetchWithTimeout(normalized, {
      method: "HEAD",
      redirect: "follow",
    });
    ok = headResponse.ok;

    if (!ok) {
      const getResponse = await fetchWithTimeout(normalized, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
      });
      ok = getResponse.ok;
    }
  } catch {
    ok = false;
  }

  linkHealthCache.set(normalized, { ok, checkedAt: Date.now() });
  return ok;
};

const getRelevantFallbackLinks = (topicText, type) => {
  const text = String(topicText || "").toLowerCase();
  const dynamicLinks = KEYWORD_LINK_RULES
    .filter((rule) => rule.keywords.some((kw) => text.includes(kw)))
    .flatMap((rule) => rule.links);

  const defaults = type === "rights" ? DEFAULT_RIGHTS_LINKS : DEFAULT_PROBLEM_LINKS;
  return [...new Set([...dynamicLinks, ...defaults])];
};

const getWorkingRelevantLink = async (candidateUrl, topicText, type) => {
  const normalizedCandidate = normalizeUrl(candidateUrl);
  if (normalizedCandidate && (await isReachable(normalizedCandidate))) {
    return normalizedCandidate;
  }

  const fallbacks = getRelevantFallbackLinks(topicText, type);
  for (const fallback of fallbacks) {
    const normalizedFallback = normalizeUrl(fallback);
    if (normalizedFallback && (await isReachable(normalizedFallback))) {
      return normalizedFallback;
    }
  }

  return type === "rights" ? DEFAULT_RIGHTS_LINKS[0] : DEFAULT_PROBLEM_LINKS[0];
};

exports.getDemographicInsights = async (req, res) => {
  try {
    const { age, state } = req.user || {};
    if (!age || !state) {
      return res.status(400).json({
        success: false,
        message: "User age and state are required for dashboard insights",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message:
          "Dashboard insights service is not configured (missing GEMINI_API_KEY)",
      });
    }

    const prompt = `
Generate a JSON object for a female user in India. Age: ${age}, State: ${state}.
The JSON must have exactly two keys: "problems" and "rights".

1. "problems": An array of exactly 10 common legal/social issues faced by women of this age in this state.
   Each item must be an object with:
   - "en" (English text, short phrase)
   - "hi" (Hindi translation)
  - "link" (a relevant URL that is likely to be working; official links are good, but relevance and working links are more important)

2. "rights": An array of exactly 10 legal rights relevant to women in this state.
   Each item must be an object with:
   - "en" (English text, short phrase)
   - "hi" (Hindi translation)
  - "link" (a relevant URL that is likely to be working; official links are good, but relevance and working links are more important)

Provide URLs that are currently reachable. If unsure, prefer stable legal information websites over obscure pages.
Return ONLY the JSON object - no markdown, no code blocks, just valid JSON.
`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    const text = response?.text;
    if (!text) {
      return res.status(502).json({
        success: false,
        message: "Invalid response from AI service",
      });
    }

    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
    }

    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed.problems) || !Array.isArray(parsed.rights)) {
      return res.status(502).json({
        success: false,
        message: "Invalid insights structure",
      });
    }

    const problems = await Promise.all(
      parsed.problems.slice(0, 10).map(async (item) => {
        const en = item.en || "";
        return {
          en,
          hi: item.hi || en,
          link: await getWorkingRelevantLink(item.link, `${en} ${item.hi || ""}`, "problems"),
        };
      })
    );

    const rights = await Promise.all(
      parsed.rights.slice(0, 10).map(async (item) => {
        const en = item.en || "";
        return {
          en,
          hi: item.hi || en,
          link: await getWorkingRelevantLink(item.link, `${en} ${item.hi || ""}`, "rights"),
        };
      })
    );

    res.json({
      success: true,
      problems,
      rights,
    });
  } catch (error) {
    console.error("Dashboard getDemographicInsights error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
