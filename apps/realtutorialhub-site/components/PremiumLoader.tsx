'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function LogoRingLoader() {
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return sessionStorage.getItem('showCourseLoader') === 'true';
    });
    const pathname = usePathname();

    useEffect(() => {
        const shouldShow = sessionStorage.getItem('showCourseLoader') === 'true';

        if (!shouldShow) return;

        const timer = setTimeout(() => {
            setIsLoading(false);
            sessionStorage.removeItem('showCourseLoader');
        }, 2500);

        return () => clearTimeout(timer);
    }, [pathname]);

    useEffect(() => {
        const handleLoad = () => {
            setIsLoading(false);
            sessionStorage.removeItem('showCourseLoader');
        };

        window.addEventListener('load', handleLoad);

        return () => {
            window.removeEventListener('load', handleLoad);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">

            {/* Orange & Blue Ring Loader */}
            <div className="relative mb-8">

                {/* Outer Orange Ring */}
                <div className="w-36 h-36 border-4 border-orange-100 rounded-full"></div>

                {/* Spinning Blue Ring */}
                <div className="absolute top-0 left-0 w-36 h-36 border-4 border-transparent 
          border-t-blue-600 border-r-blue-500 
          rounded-full animate-spin"></div>

                {/* Spinning Orange Ring (inner) */}
                <div className="absolute top-2 left-2 w-32 h-32 border-4 border-transparent 
          border-b-orange-500 border-l-orange-400 
          rounded-full animate-spin animation-delay-300"></div>

                {/* Logo in Center with Orange/Blue Border */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-100 
            flex items-center justify-center shadow-md">
                        <div className="relative w-16 h-16">
                            <Image
                                src="/Logo.png"
                                alt="Real Tutorial Hub Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* "Real Tutorial Hub" Text with Orange/Blue Gradient */}
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 
          bg-clip-text text-transparent">
                    Real Tutorial Hub
                </h2>

                {/* Orange/Blue Loading Dots */}
                <div className="flex justify-center space-x-2 pt-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse animation-delay-400"></div>
                </div>
            </div>

        </div>
    );
}
