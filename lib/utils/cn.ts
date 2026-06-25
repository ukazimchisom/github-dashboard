// The cn() utility is the most-used helper in modern React codebases.
// It combines clsx (conditional classes) with tailwind-merge (conflict resolution).
//
// Examples:
//   cn('px-4 py-2', isActive && 'bg-blue-500')
//   cn('text-sm', className)  ← safely merge external className props

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
