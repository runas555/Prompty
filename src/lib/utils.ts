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

// Детерминированная цветовая палитра для аватаров
export function getUserGradient(username: string): string {
  const gradients = [
    "from-indigo-500 to-cyan-500",
    "from-purple-500 to-indigo-600",
    "from-cyan-500 to-teal-500",
    "from-pink-500 to-rose-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}