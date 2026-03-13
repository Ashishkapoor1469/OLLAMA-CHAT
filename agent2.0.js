import Ollama from "ollama";
import readline from "readline";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);
const PLATFORM = os.platform();

//////////////////////////////////////////////////////
// SECURITY
//////////////////////////////////////////////////////

const BLOCKED_CMDS = ["rm -rf /", "shutdown", "reboot", "mkfs", "dd"];

//////////////////////////////////////////////////////
// TOOLS
//////////////////////////////////////////////////////

const tools = [
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Run shell command",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read file content",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write content to file (auto create folders)",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_folder",
      description: "Create folder",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files in directory",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_plan",
      description: "Update plan.txt with new content",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
        },
        required: ["content"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "check_structure",
      description: "Return folder structure of directory",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },
];

//////////////////////////////////////////////////////
// TOOL FUNCTIONS
//////////////////////////////////////////////////////

async function run_command({ command }) {
  if (BLOCKED_CMDS.some((cmd) => command.includes(cmd))) {
    return "Command blocked for security";
  }

  console.log(`⚡ Running: ${command}`);

  try {
    const shell = PLATFORM === "win32" ? "powershell.exe" : "/bin/bash";

    const { stdout, stderr } = await execAsync(command, {
      shell,
      timeout: 20000,
    });

    return stdout || stderr || "Command executed";
  } catch (err) {
    return `Command error: ${err.message}`;
  }
}

async function read_file({ path: filePath }) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    return `Read error: ${err.message}`;
  }
}

async function write_file({ path: filePath, content }) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);

    return `File written: ${filePath}`;
  } catch (err) {
    return `Write error: ${err.message}`;
  }
}

async function create_folder({ path: folderPath }) {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return `Folder created: ${folderPath}`;
  } catch (err) {
    return `Folder error: ${err.message}`;
  }
}

async function list_files({ path: folderPath }) {
  try {
    const files = await fs.readdir(folderPath);
    return files.join("\n");
  } catch (err) {
    return `List error: ${err.message}`;
  }
}

async function update_plan({ content }) {
  try {
    await fs.writeFile("plan.txt", content);
    return "plan.txt updated";
  } catch (err) {
    return `Plan update error: ${err.message}`;
  }
}

async function check_structure({ path: dir }) {
  try {
    async function walk(directory, prefix = "") {
      let result = "";

      const files = await fs.readdir(directory);

      for (const file of files) {
        const full = path.join(directory, file);
        const stat = await fs.stat(full);

        if (stat.isDirectory()) {
          result += `${prefix}📁 ${file}\n`;
          result += await walk(full, prefix + "  ");
        } else {
          result += `${prefix}📄 ${file}\n`;
        }
      }

      return result;
    }

    return await walk(dir);
  } catch (err) {
    return `Structure error: ${err.message}`;
  }
}

//////////////////////////////////////////////////////
// TOOL HANDLERS
//////////////////////////////////////////////////////

const toolHandlers = {
  run_command,
  read_file,
  write_file,
  create_folder,
  list_files,
  update_plan,
  check_structure,
};

//////////////////////////////////////////////////////
// SYSTEM PROMPT
//////////////////////////////////////////////////////

const SYSTEM_PROMPT = `
You are an autonomous coding agent.

WORKFLOW

1. Always start by creating a PLAN.
2. Save the plan to plan.txt.
3. The plan must include:

GOAL
FOLDER STRUCTURE
STEPS checklist

Example:

GOAL:
Build Node API

FOLDER STRUCTURE:
project/
 ├ src/
 ├ package.json

STEPS:
[ ] Create folder
[ ] Initialize npm
[ ] Install dependencies
[ ] Create server.js

EXECUTION RULES

• Always read plan.txt first
• Always check folder structure before executing a step
• Execute ONE step at a time
• Verify results
• Check folder structure again
• Update plan.txt
• Replace [ ] with [x] when step complete
• Continue until all steps are [x]

Use tools for all filesystem operations.
`;

//////////////////////////////////////////////////////
// AGENT LOOP
//////////////////////////////////////////////////////

async function agent(userInput, history) {
  history.push({
    role: "user",
    content: userInput,
  });

  try {
    await fs.access("plan.txt");
  } catch {
    await fs.writeFile("plan.txt", "No plan created yet");
  }

  while (true) {
    const response = await Ollama.chat({
      model: "gpt-oss:120b-cloud",
      messages: history,
      tools,
    });

    const message = response.message;

    history.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.log("\n🤖", message.content, "\n");
      return;
    }

    for (const call of message.tool_calls) {
      const fn = call.function.name;
      const args = call.function.arguments;

      console.log(`\n🔧 Tool: ${fn}`);

      const handler = toolHandlers[fn];

      let result = "Tool not found";

      if (handler) {
        try {
          result = await handler(args);
        } catch (err) {
          result = err.message;
        }
      }

      console.log("Result:", result.slice(0, 200));

      history.push({
        role: "tool",
        name: fn,
        content: result,
      });
    }
  }
}

//////////////////////////////////////////////////////
// CLI
//////////////////////////////////////////////////////

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

console.log("\n🚀 Autonomous Dev Agent Ready\n");

function ask() {
  rl.question("You: ", async (input) => {
    if (input === "exit") {
      rl.close();
      return;
    }

    try {
      await agent(input, history);
    } catch (err) {
      console.log("Agent error:", err);
    }

    ask();
  });
}

ask();
