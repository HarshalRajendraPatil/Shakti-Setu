// Server-side Gemini call for dashboard insights (top 10 problems + top 10 rights with links)
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

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
   - "link" (a relevant official URL about this problem – use government/legal aid sites like wcd.nic.in, nalsa.gov.in, ncw.nic.in, or state-specific women commission sites)

2. "rights": An array of exactly 10 legal rights relevant to women in this state.
   Each item must be an object with:
   - "en" (English text, short phrase)
   - "hi" (Hindi translation)
   - "link" (a relevant official URL about this right – use wcd.nic.in, nalsa.gov.in, or similar)

Use real, working URLs where possible. Return ONLY the JSON object – no markdown, no code blocks, just valid JSON.
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", response.status, errBody);
      return res.status(502).json({
        success: false,
        message: "Failed to fetch insights from AI service",
      });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
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

    const problems = parsed.problems.slice(0, 10).map((item) => ({
      en: item.en || "",
      hi: item.hi || item.en || "",
      link: item.link || "https://wcd.nic.in/",
    }));

    const rights = parsed.rights.slice(0, 10).map((item) => ({
      en: item.en || "",
      hi: item.hi || item.en || "",
      link: item.link || "https://nalsa.gov.in/",
    }));

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
