import chalk from "chalk";

export function logStep(text) {
  console.log(chalk.blue("➡"), text);
}

export function logDone(text) {
  console.log(chalk.green("✔"), text);
}

export function logError(text) {
  console.log(chalk.red("✖"), text);
}
