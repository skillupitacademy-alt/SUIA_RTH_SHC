import { SessionExpiryModal } from "@/components/auth/SessionExpiryModal";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminLayout>
            <SessionExpiryModal />
            {children}
        </AdminLayout>
    );
}
