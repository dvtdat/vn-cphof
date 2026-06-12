import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge our custom font-size tokens (globals.css @theme).
// Without this it classifies text-body/text-stat as colors, so a text color
// in the same cn() call silently drops the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["3xs", "2xs", "body", "md", "stat"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
