import "./globals.css";

export const metadata = {
  title: "DESIGNLANG — Reverse-Engineer Any Website's Design System",
  description: "One command. 8 output files. Colors, typography, spacing, layout, accessibility, interactions, and more. npx designlang",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
