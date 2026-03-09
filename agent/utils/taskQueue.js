import fs from "fs-extra";

const FILE = "./tasks/tasks.json";

export async function loadTasks() {
  if (!(await fs.pathExists(FILE))) {
    await fs.outputJson(FILE, []);
  }

  return fs.readJson(FILE);
}

export async function saveTask(task) {
  const tasks = await loadTasks();

  tasks.push({
    id: Date.now(),
    task,
    done: false,
  });

  await fs.writeJson(FILE, tasks, { spaces: 2 });
}

export async function getNextTask() {
  const tasks = await loadTasks();

  return tasks.find((t) => !t.done);
}

export async function markTaskDone(id) {
  const tasks = await loadTasks();

  const index = tasks.findIndex((t) => t.id === id);

  if (index >= 0) {
    tasks[index].done = true;
  }

  await fs.writeJson(FILE, tasks, { spaces: 2 });
}


export async function clearTasks(){

await fs.writeJson(FILE, [], {spaces:2});

console.log("🧹 Task file cleared");

}