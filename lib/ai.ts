import OpenAI from "openai";

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function requireApiKey(): string {
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable AI features."
    );
  }
  return k;
}

export function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: requireApiKey() });
}

export function modelName(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export async function completeJson<T>(system: string, user: string): Promise<T> {
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model: modelName(),
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("The model returned an empty response.");
  return JSON.parse(text) as T;
}
