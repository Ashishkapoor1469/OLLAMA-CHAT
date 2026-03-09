import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export const shellTool = {
  type: "function",
  function: {
    name: "run_command",
    description: "run shell command",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" },
      },
      required: ["command"],
    },
  },
};

export async function handleShellTool(args) {
  const { stdout, stderr } = await execAsync(args.command);

  return stdout || stderr;
}
