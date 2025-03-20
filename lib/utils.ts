import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomID(prefix: string = "") {
  const validCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = prefix;
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * validCharacters.length);
    id += validCharacters.charAt(randomIndex);
  }

  return id;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function calculateAge(birthDate: Date | string): string {
  const today = new Date();
  const birth = new Date(birthDate);

  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0) {
    return `${years} year${years !== 1 ? "s" : ""}, ${remainingMonths} month${
      remainingMonths !== 1 ? "s" : ""
    }`;
  }

  return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
}
