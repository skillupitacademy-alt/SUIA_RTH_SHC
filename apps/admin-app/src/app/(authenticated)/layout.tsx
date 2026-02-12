import AdminLayout from "@/components/layout/AdminLayout";
import { SessionExpiryModal } from "@/components/auth/SessionExpiryModal";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminLayout>
            <SessionExpiryModal />
            {children}
        </AdminLayout>
    );
}
