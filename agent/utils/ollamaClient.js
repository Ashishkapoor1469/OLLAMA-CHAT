import Ollama from "ollama";
import { MODEL } from "../config.js";

export async function askLLM(messages, tools = []) {
  const response = await Ollama.chat({
    model: MODEL,
    messages,
    tools,
  });

  return response.message;
}
