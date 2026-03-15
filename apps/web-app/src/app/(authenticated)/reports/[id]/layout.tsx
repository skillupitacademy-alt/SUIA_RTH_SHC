import { ReportThemeProvider } from "@/components/reports/context/ReportThemeContext";

export default function ReportLayout({ children }: { children: React.ReactNode }) {
    return (
        <ReportThemeProvider>
            {children}
        </ReportThemeProvider>
    );
}
