import type { Metadata } from "next";
import "./globals.css";
import AdminLayout from "@/components/layout/AdminLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
    title: "QuizAdmin | Governance",
    description: "Enterprise Quiz Platform Admin Terminal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <AdminLayout>
                        {children}
                    </AdminLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
