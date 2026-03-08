import Ollama from "ollama";
import readline from "readline";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const tools = [
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Runs shell command and Return the Output",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of the file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "write content to a file. use to create files and use to create file inside a givened folder [eg ./home/filename.txt]. On current directory if path is not given.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to write to",
          },
          content: {
            type: "String",
            description: "Content to write",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mk_folder",
      description:
        "make folders on current directory and folders in side a folder[eg. ./home/src] . and don't use to create file.On current directory if path is not given.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "name of the folder",
          },
        },
        required: ["path"],
      },
    },
  },
];

const BLOCKED_CMDS = [""]; // for blocking dangorus commands

async function run_command({ command }) {
  console.log(`\n❁ Running ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
    return stdout || stderr || "(no output)";
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function read_file({ path }) {
  const { readFile } = await import("fs/promises");
  try {
    return await readFile(path, "utf-8");
  } catch (error) {
    return `Error read_file: ${error.message}`;
  }
}

async function write_file({ path, content }) {
  const { writeFile } = await import("fs/promises");
  try {
    await writeFile(path, content, "utf-8");
    return `Successfully worte to ${path}`;
  } catch (error) {
    return `Error read_file: ${error.message}`;
  }
}

async function mk_folder({ path }) {
  const { mkdir } = await import("fs/promises");
  try {
    await mkdir(path, { recursive: true });
    return `Successfully created folder to ${path}`;
  } catch (error) {
    return `Error read_file: ${error.message}`;
  }
}

const toolHandlers = {
  run_command,
  read_file,
  write_file,
  mk_folder,
};

async function agent(userMessage, history = []) {
  history.push({ role: "user", content: userMessage });

  while (true) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const loader = setInterval(() => {
      process.stdout.write(`\r${frames[i++ % frames.length]} Thinking...`);
    }, 80);

    const response = await Ollama.chat({
      model: "qwen3:0.6b",
      messages: history,
      tools,
    });

    clearInterval(loader);
    process.stdout.write("\r                \r"); // clear the loader line
    const message = response.message;
    history.push(message);
    //if no tool call
    if (!message.tool_calls || message.tool_calls.length === 0) {
      history.pop();
      process.stdout.write("\n🤖Bot: ");
      const stream = await Ollama.chat({
        model: "qwen3:0.6b",
        messages: history,
        stream: true,
      });

      let fullReply = "";
      let inThink = false;
      for await (const chunk of stream) {
        const token = chunk.message?.content;
        fullReply += token;
        if (token.includes("<think>")) {
          inThink = true;
          process.stdout.write("\x1b[2m\x1b[3m"); //dim + italic
          continue;
        }
        if (token.includes("</think>")) {
          inThink = false;
          process.stdout.write("\x1b[0m\n"); //reset + gap in real ans
        }
        process.stdout.write(token);
      }
      process.stdout.write("\n");
      history.push({ role: "assistant", content: fullReply });
      return;
    }

    // exe each tool call
    for (const toolCall of message.tool_calls) {
      const fn = toolCall.function.name;
      const args = toolCall.function.arguments;
      console.log(`\n⛓️‍💥 Tool Called : ${fn}${JSON.stringify(args)}`);

      const handler = toolHandlers[fn];
      const res = handler ? await handler(args) : `unkown tool ${fn}`;
      console.log(`Result : ${res.slice(0, 200)}...`);
      history.push({
        role: "tool",
        content: res,
      });
    }
    //loop again - model will process tool results and either call more
  }
}

//CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const history = [
  {
    role: "system",
    content:
      "you are a helpful assistant with access to shell commands ,file reading, writing and make folder. Use these tools to help the user accomplish tasks. always explain what you're doing.",
  },
];

console.log(
  "Agent is ready. Ask me to run commands , read / write files, etc.\n",
);

function ask() {
  process.stdout.write("\x1b[0m");
  rl.question("You:", async (input) => {
    if (!input.trim() || input === "exit") {
      return rl.close();
    }
    try {
      await agent(input, history);
    } catch (error) {
      console.log("Error:", error.message);
    }
    ask();
  });
}

ask();
