import type { ChatCompletionMessageToolCall } from "openai/resources.mjs";
import type { ChatCompletionUserMessageParam } from "openai/src/resources.js";
import { z } from "zod";
import {
  deleteAllBannedUser,
  deleteBannedUser,
  getBannedUsers,
  getMatchedDocuments,
  insertBannedUser,
  saveChatMessage,
} from "./db";
import { runLLMEmbedding } from "./llm";

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
  // proteger usuario daqueles que estão falando mal dele
  // en: "Protect a user from those who are talking bad about him",
  description: "Protect an user from those who are talking bad about him",
  parameters: z.object({
    comment: z.string().describe(`The comment to protect the user from.`),
  }),
};

const protectUser = async (toolArgs: Record<string, unknown>) => {
  const { comment = "" } = toolArgs;
  await saveChatMessage("@john.doe", comment as string);
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

  // const bannedUsers = await getBannedUsers();

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

  // const bannedMessage = bannedUsers?.length
  //   ? `
  //   Mas primeiro, verifica se eles já estão banidos.
  //   Se sim, só informe que eles estão banidos e não faça nada.
  //   Aqui abaixo estão os usuários banidos:
  //   ---
  //   ${bannedUsers.map((user) => user.username).join(", ")}
  //   --- `
  //   : "";
  // Se sim, quero que chame a função (banUser) para banir esses usuários.
  return `
    Abaixo estão as mensagens de usuários que mencionam ${username}:
    ---
    ${matchedContent.join("\n")}
    ---
    Quero que verifique se estão falando mal de ${username}.
    Me explique que tipo de comentários são esses e se são ruins ou bons, mencinando o nome do usuário.
  `;
};

// const whatAreTheyTalkingAboutTool = {
//   name: "whatAreTheyTalkingAbout",
//   description: "What are they talking about? Is it good or bad?",
//   parameters: z.object({
//     isBad: z.boolean().describe(`Is it bad?`),
//     comment: z.string().describe(`The comment.`),
//     username: z
//       .string()
//       .describe(`The username of the person you are talking about.`),
//   }),
// };

// const whatAreTheyTalkingAbout = async (
//   toolArgs: Record<string, unknown>,
//   userMessage: ChatCompletionUserMessageParam
// ) => {
//   const { isBad, username, comment } = toolArgs;
//   return `
//     Abaixo está a mensagem
//     ---
//     ${matchedContent.join("\n")}
//     ---
//     Quero que verifique se estão falando mal de ${username}.
//     Se sim, quero que chame a função (banUser) para banir esses usuários.
//     E se solicitado, proteja ${username} de quem está falando mal dele chamando a função (protectUser), e como vai fazer isso será:
//     - Passando como argumento um comentário que você vai criar para proteger ${username} de quem está falando mal dele.
//     Caso não tenha nada de ruim, apenas me diga sobre o que estão falando de bom.
//   `;
// };

export const tools = [
  banUserTool,
  liftTheBanTool,
  liftAllBansTool,
  // protectUserTool,
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
