import type { Priority } from "../types";

export function priorityLabel(priority: Priority) {
  switch (priority) {
    case "low":
      return "Baixa";
    case "medium":
      return "Média";
    case "high":
      return "Alta";
    case "critical":
      return "Crítica";
  }
}

export function priorityClasses(priority: Priority) {
  switch (priority) {
    case "low":
      return "border-teal/30 bg-teal/10 text-teal";
    case "medium":
      return "border-blue/30 bg-blue/10 text-blue";
    case "high":
      return "border-amber-300/25 bg-amber-300/10 text-amber-200";
    case "critical":
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  }
}

