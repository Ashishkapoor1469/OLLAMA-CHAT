import readline from "readline";

import { askLLM } from "./utils/ollamaClient.js";

import { createPlan } from "./planner.js";

import { getNextTask, markTaskDone, clearTasks } from "./utils/taskQueue.js";

import { fileTool, handleFileTool } from "./tools/fileTool.js";
import { folderTool, handleFolderTool } from "./tools/folderTool.js";
import { shellTool, handleShellTool } from "./tools/shellTool.js";

import { startFolderChecker } from "./folderChecker.js";

import { logStep, logDone } from "./utils/logger.js";

startFolderChecker();

const tools = [fileTool, folderTool, shellTool];

const handlers = {
  write_file: handleFileTool,
  create_folder: handleFolderTool,
  run_command: handleShellTool,
};

async function runAgent(goal) {
  logStep("Creating plan...");

  await createPlan(goal);

  while (true) {
    const task = await getNextTask();

    if (!task) {
      logDone("All tasks completed");
      await clearTasks();

      rl.close();
      return;
    }

    logStep(`Task: ${task.task}`);

    const messages = [
      {
        role: "system",
        content: "You are an autonomous coding agent.",
      },
      {
        role: "user",
        content: `Execute this task: ${task.task}`,
      },
    ];

    const msg = await askLLM(messages, tools);

    if (msg.tool_calls) {
      for (const call of msg.tool_calls) {
        const name = call.function.name;
        const args = call.function.arguments;

        const result = await handlers[name](args);

        console.log("tool result:", result);
      }
    }

    await markTaskDone(task.id);

    logDone(`Finished: ${task.task}`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Goal: ", async (goal) => {
  if (goal === "exit") {
    rl.close();
    return;
  }
  await runAgent(goal);

  rl.close();
});
