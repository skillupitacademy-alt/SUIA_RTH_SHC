import type { Metadata } from "next";
import "./globals.css";
import { AdminLayout } from "@/components/layout/AdminLayout";

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
        <html lang="en">
            <body>
                <AdminLayout>
                    {children}
                </AdminLayout>
            </body>
        </html>
    );
}
