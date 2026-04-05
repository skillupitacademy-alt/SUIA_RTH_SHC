import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useStrictNavigation() {
    const pathname = usePathname();
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

    const cancelNavigation = () => {
        setShowWarning(false);
    };

    return { showWarning, cancelNavigation };
}
