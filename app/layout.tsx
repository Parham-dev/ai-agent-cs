import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { MantineThemeProvider } from "@/components/providers";
import { ColorSchemeScript } from "@mantine/core";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Customer Service Platform",
  description: "OpenSource AI Customer Service Platform with MCP Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className="antialiased">
        <MantineThemeProvider>
          {children}
          <Toaster richColors />
        </MantineThemeProvider>
      </body>
    </html>
  );
}
