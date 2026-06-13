import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptSocial - Социальная сеть промпт-инженеров",
  description: "Делитесь системными инструкциями, оценивайте, версионируйте и комментируйте лучшие промпты.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}