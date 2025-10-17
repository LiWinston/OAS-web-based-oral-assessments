import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function preventNumberInputScroll(event) {
  if (!event) return;
  event.preventDefault();
  if (event.currentTarget) {
    event.currentTarget.blur();
  }
}
