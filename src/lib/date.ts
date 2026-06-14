// Date utilities for watering schedule display

const DAY_MS = 86400000;

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / DAY_MS);
  const hours = Math.floor((absDiff % DAY_MS) / 3600000);

  const isPast = diff < 0;
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + DAY_MS).toDateString();
  const isYesterday = d.toDateString() === new Date(now.getTime() - DAY_MS).toDateString();

  if (isToday) return hours === 0 ? "just now" : `in ${hours}h`;
  if (isTomorrow) return "tomorrow";
  if (isYesterday) return "yesterday";

  if (isPast) {
    if (days === 0) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  }

  if (days === 0) return `in ${hours}h`;
  if (days < 7) return `in ${days}d`;
  if (days < 30) return `in ${Math.floor(days / 7)}w`;
  return `in ${Math.floor(days / 30)}mo`;
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / DAY_MS);
}

export function isOverdue(date: string | Date): boolean {
  return daysUntil(date) < 0;
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toDateString() === new Date().toDateString();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
