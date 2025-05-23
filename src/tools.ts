import type { ChatCompletionMessageToolCall } from "openai/resources.mjs";
import type { ChatCompletionUserMessageParam } from "openai/src/resources.js";
import { z } from "zod";
import {
  deleteAllBannedUser,
  deleteBannedUser,
  getMatchedDocuments,
  insertBannedUser,
  saveChatMessage,
} from "./db";
import { runLLMCompletions, runLLMEmbedding } from "./llm";

const banUserTool = {
  name: "banUser",
  description: "Ban a user from the chat.",
  parameters: z.object({
    username: z.string().describe(`The username of the person to ban.`),
  }),
};

const banUser = async (toolArgs: Record<string, unknown>) => {
  const { username = "" } = toolArgs;

  await insertBannedUser(username as string);
  console.log("banning user", { username });

  return `O usuário ${username} foi banido com sucesso. Avisa isso de forma bem séria e formal`;
};

const liftTheBanTool = {
  name: "liftTheBan",
  description: "Lift the ban from a user.",
  parameters: z.object({
    username: z.string().describe(`The username of the person to unban.`),
  }),
};

const liftTheBan = async (toolArgs: Record<string, unknown>) => {
  const { username = "" } = toolArgs;

  await deleteBannedUser(username as string);
  console.log("lifting ban for user", { username });

  return `O banimento do usuário ${username} foi removido com sucesso. Avisa isso de forma bem séria e formal`;
};

const liftAllBansTool = {
  name: "liftAllBans",
  description: "Lift all bans from users.",
  parameters: z.object({}),
};

const liftAllBans = async (toolArgs: Record<string, unknown>) => {
  await deleteAllBannedUser();
  console.log("lifting ban for users");

  return `Todos os banimentos foram removidos com sucesso. Avisa isso de forma bem séria e formal`;
};

const protectUserTool = {
  name: "protectUser",
  description: "Protect an user from those who are talking bad about him",
  parameters: z.object({
    username: z.string().describe(`The username of the person to protect.`),
  }),
};

const protectUser = async (toolArgs: Record<string, unknown>) => {
  const { username = "" } = toolArgs;

  const message = await runLLMCompletions([
    {
      role: "user",
      content: `
      Você um usuário do chat e está vendo que alguém está falando mal de um usuário que é seu colega.
      Alguém está falando sobre ${username}. 
      Você deve responder com uma mensagem curta falando bem de ${username}, 
      escreva de forma natural, como se você estivesse falando com um amigo.
      Não pode ser algo que não faça sentido. A mensagem deve ser curta e direta.`,
    },
  ]);

  await saveChatMessage("@john.doe", message.content as string);
  return `O comentário de proteção foi salvo com sucesso. Avisa isso de forma bem séria e formal`;
};

const areYouTalkingAboutSomeoneInTheChatTool = {
  name: "areYouTalkingAboutSomeoneInTheChat",
  description: "Are you talking about someone in the chat?",
  parameters: z.object({
    username: z
      .string()
      .describe(`The username of the person you are talking about.`),
  }),
};

const areYouTalkingAboutSomeoneInTheChat = async (
  toolArgs: Record<string, unknown>,
  userMessage: ChatCompletionUserMessageParam
) => {
  const { username } = toolArgs;
  const content = `Alguém está falando sobre ${username} ?`;
  const embedding = await runLLMEmbedding(content);
  const matchedDocuments = await getMatchedDocuments(embedding);

  console.log({ matchedDocuments });

  if (!matchedDocuments.length) {
    return `Não, ${username} não está sendo mencionado por ninguém.`;
  }

  const matchedContent = matchedDocuments.map((doc) => {
    const regex = /(?<username>[^:]+): (?<message>.+)/;
    const match = doc.content.match(regex);
    if (!match) {
      return "";
    }
    const { username, message } = match.groups as {
      username: string;
      message: string;
    };
    return `
      usuário: ${username};  
      comentário: ${message};`;
  });

  return `
    Abaixo estão as mensagens de usuários que mencionam ${username}:
    ---
    ${matchedContent.join("\n")}
    ---
    Quero que verifique se estão falando mal de ${username}.
    Me explique que tipo de comentários são esses e se são ruins ou bons, mencinando o nome do usuário.
  `;
};

export const tools = [
  banUserTool,
  liftTheBanTool,
  liftAllBansTool,
  protectUserTool,
  areYouTalkingAboutSomeoneInTheChatTool,
];

export const runTool = async (
  toolCall: ChatCompletionMessageToolCall,
  userMessage: ChatCompletionUserMessageParam
) => {
  const toolArgs = JSON.parse(toolCall.function.arguments || "{}");
  switch (toolCall.function.name) {
    case areYouTalkingAboutSomeoneInTheChatTool.name: {
      return areYouTalkingAboutSomeoneInTheChat(toolArgs, userMessage);
    }
    case banUserTool.name: {
      return banUser(toolArgs);
    }
    case protectUserTool.name: {
      return protectUser(toolArgs);
    }
    case liftTheBanTool.name: {
      return liftTheBan(toolArgs);
    }
    case liftAllBansTool.name: {
      return liftAllBans(toolArgs);
    }
    default: {
      throw new Error(`Tool ${toolCall.function.name} not found`);
    }
  }
};
