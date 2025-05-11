import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export async function saveChatMessage(username: string, message: string) {
  const { error } = await supabase.from("chat").insert({
    username,
    message,
  });
  if (error) console.error(error);
}

export async function saveDocument(content: string, embedding: number[]) {
  const { error } = await supabase.from("documents").insert({
    content,
    embedding,
  });
  if (error) console.error(error);
}

export async function getChatMessagesNotEmbeddedYet() {
  const { data, error } = await supabase
    .from("chat")
    .select("*")
    .is("embedded", false);
  if (error) console.error(error);
  return data;
}

export async function updateChatMessagesToEmbedded(ids: number[]) {
  const { data, error } = await supabase
    .from("chat")
    .update({ embedded: true })
    .in("id", ids);
  if (error) console.error(error);
  return data;
}

export async function getMatchedDocuments(
  embedding: number[]
): Promise<{ content: string; similarity: number }[]> {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding, // Pass the embedding you want to compare
    match_threshold: 0.5, // Choose an appropriate threshold for your data
    match_count: 10, // Choose the number of matches
  });
  if (error) console.error(error);
  return data;
}

export async function insertBannedUser(username: string) {
  const { data, error } = await supabase
    .from("banned_users")
    .insert({ username });
  if (error) console.error(error);
  return data;
}

export async function deleteBannedUser(username: string) {
  const { data, error } = await supabase
    .from("banned_users")
    .delete()
    .eq("username", username);
  if (error) console.error(error);
  return data;
}

export async function deleteAllBannedUser() {
  const { data, error } = await supabase
    .from("banned_users")
    .delete()
    .neq("id", 0);

  if (error) console.error(error);
  return data;
}

export async function getBannedUsers() {
  const { data, error } = await supabase.from("banned_users").select("*");
  if (error) console.error(error);
  return data;
}
