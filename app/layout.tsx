import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { MantineThemeProvider, AuthProvider } from "@/components/providers";
import { ColorSchemeScript } from "@mantine/core";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/services/openai-initialization.service";

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
        <AuthProvider>
          <TooltipProvider>
            <MantineThemeProvider>
              {children}
              <Toaster richColors />
            </MantineThemeProvider>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
