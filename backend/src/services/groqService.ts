import Groq from "groq-sdk";

export interface GroqListingAnalysis {
  category: string;
  dietaryTags: string[];
  safetyAdvice: string;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const hasGroqKey = Boolean(GROQ_API_KEY);

const client = hasGroqKey
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "text" in item) {
          return (item as { text?: string }).text ?? "";
        }
        return "";
      })
      .join("");
  }
  return "";
}

export async function analyzeListing(description: string): Promise<GroqListingAnalysis> {
  const prompt = `Analyze the following food listing description and return a JSON object with category, dietaryTags array, and safetyAdvice:\n${description}`;

  if (!client) {
    return {
      category: "unknown",
      dietaryTags: [],
      safetyAdvice: "AI analysis is unavailable because the Groq API key is missing or invalid.",
    };
  }

  const response = await client.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content:
          "You are a food rescue assistant. Extract a category, dietary tags, and safety advice from the food listing description.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 250,
  });

  const rawMessage = response.choices?.[0]?.message?.content;
  const raw = normalizeMessageContent(rawMessage).trim();

  try {
    const parsed = JSON.parse(raw) as GroqListingAnalysis;
    return {
      category: parsed.category ?? "unknown",
      dietaryTags: Array.isArray(parsed.dietaryTags) ? parsed.dietaryTags : [],
      safetyAdvice: parsed.safetyAdvice ?? "No safety advice available.",
    };
  } catch {
    return {
      category: "unknown",
      dietaryTags: [],
      safetyAdvice: "Unable to analyze listing. Please review manually.",
    };
  }
}
