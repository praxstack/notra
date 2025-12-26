import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrganizationAvatar(slug: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${slug}&backgroundType=gradientLinear,solid&backgroundColor=8E51FF`;
}
