import "dotenv/config";
import { saveDocument, supabase, updateChatMessagesToEmbedded } from "./db";
import { runLLMEmbedding } from "./llm";
import type { ChatMessage } from "./types";
import { showLoader } from "./ui";

type SyncDocumentPayload = {
  payload: { message: string };
};

export const syncDocument = async ({ payload }: SyncDocumentPayload) => {
  const chat = JSON.parse(payload.message) as ChatMessage;
  const { username, message } = chat;
  const content = `${username}: ${message}`;

  const spinner = showLoader(`Syncing document...`);
  spinner.start();

  const embedding = await runLLMEmbedding(content);
  await saveDocument(content, embedding);

  await updateChatMessagesToEmbedded([chat.id]);

  spinner.success(`synced: ${content}`);
  spinner.stop();
};

const myChannel = supabase.channel("test-channel");

myChannel
  .on("broadcast", { event: "sync-document" }, (payload) =>
    syncDocument(payload as unknown as SyncDocumentPayload)
  )
  .subscribe();
console.log("Subscribed to channel: test-channel");
