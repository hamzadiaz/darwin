import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DARWIN — AI Creatures That Think, Fight & Evolve',
  description: 'Create your own AI-powered agent on Solana. Give it a personality, train it in battle, and watch it evolve.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-bg-primary">
        {children}
      </body>
    </html>
  );
}
