import { AuthProvider } from "@/context/auth-context";
import { WebSessionWatcherContainer } from "@/components/auth/WebSessionWatcherContainer";
import { SessionExpiryModal } from "@/components/auth/SessionExpiryModal";
import { AppShell } from "@/components/layout/AppShell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SessionExpiryModal />
            <WebSessionWatcherContainer />
            <AppShell>
                {children}
            </AppShell>
        </AuthProvider>
    );
}
