import fs from "fs-extra";
import { REQUIRED_FOLDERS, CHECK_INTERVAL } from "./config.js";
import { logDone } from "./utils/logger.js";

export function startFolderChecker() {
  setInterval(async () => {
    for (const folder of REQUIRED_FOLDERS) {
      if (!(await fs.pathExists(folder))) {
        await fs.ensureDir(folder);

        logDone(`Auto-created missing folder: ${folder}`);
      }
    }
  }, CHECK_INTERVAL);
}
