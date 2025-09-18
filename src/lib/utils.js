// util.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names for Tailwind CSS.
 * It uses `clsx` to handle conditional classes and `tailwind-merge` to
 * resolve conflicting Tailwind classes.
 * @param {...any} inputs - Class names or objects with conditional classes.
 * @returns {string} The merged and optimized class name string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random 6-digit verification code.
 * @returns {string} A string representing the 6-digit code.
 */
export function generateVerificationCode() {
  // Generates a number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}