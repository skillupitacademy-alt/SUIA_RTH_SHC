import { GuestAdminLayout } from "@/components/layout/GuestAdminLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <GuestAdminLayout>
            {children}
        </GuestAdminLayout>
    );
}
