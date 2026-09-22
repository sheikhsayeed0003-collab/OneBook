"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { SocialProvider } from "@/components/social-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SocialProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </SocialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
