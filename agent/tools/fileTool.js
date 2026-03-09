import { writeFile, readFile } from "../utils/fileUtils.js";

export const fileTool = {
  type: "function",
  function: {
    name: "write_file",
    description: "write file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
      },
      required: ["path", "content"],
    },
  },
};

export async function handleFileTool(args) {
  return writeFile(args.path, args.content);
}
