export function detectProjectType(goal) {
  const text = goal.toLowerCase();

  if (text.includes("next") || text.includes("nextjs")) {
    return { s: "next", text: text };
  }

  if (text.includes("js")) {
    return { s: "js", text: text };
  }

  if (text.includes("react")) {
    return { s: "react", text: text };
  }

  if (
    text.includes("node") ||
    text.includes("express") ||
    text.includes("api")
  ) {
    return { s: "node", text: text };
  }

  if (
    text.includes("html") ||
    text.includes("css") ||
    text.includes("javascript") ||
    text.includes("simple")
  ) {
    return { s: "vanilla", text: text };
  }

  return { s: "vanilla", text: text };
}
