import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/shared/query-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub Dashboard",
  description: "Engineering manager dashboard for monitoring team PR activity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning is REQUIRED when using next-themes.
        Without it, React throws a hydration mismatch warning because
        next-themes adds the 'dark' class to <html> on the client
        after server render causing a deliberate mismatch.
        suppressHydrationWarning tells React to ignore this specific
        difference on the <html> element.
      */}
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
