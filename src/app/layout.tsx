import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptHistorian - Хранилище промптов",
  description: "Удобный каталог агентов и история изменений системных инструкций",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}