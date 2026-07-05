import { createId } from "./id";
import type { Library } from "./types";

export function createLibrary(name: string): Library {
  return {
    id: createId(),
    name: name.trim(),
    stories: [],
  };
}
