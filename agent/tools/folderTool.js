import fs from "fs-extra";

export const folderTool = {
  type: "function",
  function: {
    name: "create_folder",
    description: "create folder",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
      },
      required: ["path"],
    },
  },
};

export async function handleFolderTool(args) {
  await fs.ensureDir(args.path);

  return "folder created";
}
