"use client"
import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/context/Auth-context";
import { Navbar } from "@/components/navbar";

interface ProviderProps {
  children: React.ReactNode;
}

const Provider = ({ children }: ProviderProps) => {
  return (
    <AuthProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              {children}
            </main>
          </div>
        </NextThemesProvider>
    </AuthProvider>
  );
};

export default Provider;