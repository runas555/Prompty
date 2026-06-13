export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateUUID(): string {
  return "id_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}