export function detectProjectType(goal) {
  const text = goal.toLowerCase();

  if (text.includes("next") || text.includes("nextjs")) {
    return "next";
  }

  if (text.includes("react")) {
    return "react";
  }

  if (
    text.includes("node") ||
    text.includes("express") ||
    text.includes("api")
  ) {
    return "node";
  }

  if (
    text.includes("html") ||
    text.includes("css") ||
    text.includes("javascript") ||
    text.includes("simple")
  ) {
    return "vanilla";
  }

  return "vanilla";
}
