import fs from "fs-extra";

const FILE = "./memory/history.json";

export async function loadTasks() {
  if (!(await fs.pathExists(FILE))) {
    await fs.outputJson(FILE, []);
  }

  return fs.readJson(FILE);
}

export async function memory(msg) {
  const tasks = await loadTasks();
  tasks.push({
    id: Date.now(),
    content: msg.content,
    role: msg.role,
    think: msg.thinking,
    tool_call: msg.tool_calls,
    tool_name: msg.tool_name,
    done: false,
  });
  return {
    role: "asistent",
    content: {
      tool_call: tasks.tool_calls,
      prevTasks: [tasks.content],
    },
  };
}
