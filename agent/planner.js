import { saveTask } from "./utils/taskQueue.js";
import { detectProjectType } from "./projectDetector.js";

export async function createPlan(goal){

const type = detectProjectType(goal);

console.log("Detected project type:",type);

let tasks=[];

if(type==="vanilla"){

tasks=[
"create_folder project",
"write_file project/index.html",
"write_file project/style.css",
"write_file project/script.js"
];

}

if(type==="node"){

tasks=[
"create_folder project",
"run_command npm init -y",
"run_command npm install express",
"write_file project/server.js"
];

}

if(type==="react"){

tasks=[
"run_command npx create-vite@latest project --template react",
"run_command cd project && npm install",
"run_command cd project && npm run dev"
];

}

if(type==="next"){

tasks=[
"run_command npx create-next-app@latest project",
"run_command cd project && npm install",
"run_command cd project && npm run dev"
];

}

for(const t of tasks){
await saveTask(t);
}

}