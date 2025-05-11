import "dotenv/config";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { runLLMCompletions } from "./llm";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";
import { logMessage, showLoader } from "./ui";
import { runTool, tools } from "./tools";

const rl = readline.createInterface({
  input,
  output,
});

const chat = async () => {
  const history: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
      Você é um assistente de IA útil. Responda às perguntas do usuário da melhor maneira possível.
      `,
    },
  ];

  const start = () => {
    rl.question("You ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        rl.close();
        return;
      }
      const spinner = showLoader("");
      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: userInput,
      };

      history.push(userMessage);

      const answer = async () => {
        spinner.start("🤔");

        const response = await runLLMCompletions(history, tools);
        history.push(response);
        if (response.content) {
          logMessage(response);
          spinner.stop();
          return;
        }
        if (!response.tool_calls?.length) {
          throw new Error("No tool calls found");
        }

        const promises = response.tool_calls.map(async (toolCall) => {
          spinner.text = `executing: ${toolCall.function.name}`;

          const toolResponse = await runTool(toolCall, userMessage);

          history.push({
            role: "tool",
            content: toolResponse,
            tool_call_id: toolCall.id,
          });

          spinner.text = `done: ${toolCall.function.name}`;
        });

        await Promise.all(promises);
        await answer();
      };
      await answer();
      start();
    });
  };

  start();
};

chat();
