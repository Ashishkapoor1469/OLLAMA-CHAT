import fs from "fs-extra";

export async function writeFile(path, content) {
  await fs.outputFile(path, content);

  return "file written";
}

export async function readFile(path) {
  return fs.readFile(path, "utf8");
}
