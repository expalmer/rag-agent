import type OpenAI from "openai";

export type AIMessage =
  | OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "tool"; content: string; tool_call_id: string };

export interface ToolFn<A = any, T = any> {
  (input: { userMessage: string; toolArgs: A }): Promise<T>;
}

export type ChatMessage = {
  id: number;
  username: string;
  message: string;
  created_at: string;
  embedded: boolean;
};
