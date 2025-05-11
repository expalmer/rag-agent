import { OpenAI } from "openai";
import { zodFunction } from "openai/helpers/zod.mjs";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runLLMCompletions = async (
  messages: ChatCompletionMessageParam[],
  tools: any[] = []
) => {
  const formattedTools = tools.map(zodFunction);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages,
    tools: formattedTools,
  });

  return response.choices[0].message;
};

export const runLLMEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
};
