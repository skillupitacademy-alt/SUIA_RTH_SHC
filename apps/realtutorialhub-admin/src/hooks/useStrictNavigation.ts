import { usePathname,useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';

export function useStrictNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const logout = useAuthStore((s) => s.logout);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        // Only enforce on protected routes (not login)
        if (pathname === '/login') return;

        // Push a state to trap "Back" button
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            // Prevent actual backward navigation immediately by pushing state again
            window.history.pushState(null, '', window.location.href);
            setShowWarning(true);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [pathname]);

    const confirmLogout = () => {
        logout();
        router.push('/login');
    };

    const cancelNavigation = () => {
        setShowWarning(false);
    };

    return { showWarning, confirmLogout, cancelNavigation };
}
