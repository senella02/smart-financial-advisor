import "server-only";
import th from "./th.json";

export function getMessages() {
  // shortcut: Phase 1 ships Thai UI only; add locale selection with the English UI release.
  return { language: "th" as const, messages: th };
}
