"use client";

// next-themes requires a Client Component wrapper
// because it uses localStorage and browser APIs

import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      // Use the 'class' strategy to match our Tailwind config
      attribute="class"
      // Default to system preference on first visit
      defaultTheme="system"
      // Allow 'light', 'dark', and 'system' as valid themes
      enableSystem={true}
      // Prevents the flash of wrong theme on page load
      // by blocking rendering until the theme is resolved
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
