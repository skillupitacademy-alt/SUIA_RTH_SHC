'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useBrand } from '@quiz/marketing-site/brand';

export default function LogoRingLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const brand = useBrand();

    useEffect(() => {
        const shouldShow = sessionStorage.getItem('showCourseLoader') === 'true';

        if (shouldShow) {
            setIsLoading(true);

            const timer = setTimeout(() => {
                setIsLoading(false);
                sessionStorage.removeItem('showCourseLoader');
            }, 2500);

            return () => clearTimeout(timer);
        }
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

    const primary = brand.colors.primary;
    const secondary = brand.colors.secondary;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">

            <div className="relative mb-8">

                <div
                    className="w-36 h-36 border-4 rounded-full opacity-20"
                    style={{ borderColor: primary }}
                ></div>

                <div className="absolute top-0 left-0 w-36 h-36 border-4 border-transparent 
          rounded-full animate-spin"
                    style={{
                        borderTopColor: secondary,
                        borderRightColor: secondary,
                    }}
                ></div>

                <div className="absolute top-2 left-2 w-32 h-32 border-4 border-transparent 
          rounded-full animate-spin animation-delay-300"
                    style={{
                        borderBottomColor: primary,
                        borderLeftColor: primary,
                    }}
                ></div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center shadow-md"
                        style={{ borderColor: `${secondary}22` }}
                    >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                            <Image
                                src={brand.iconLogo}
                                alt={`${brand.name} Logo`}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="text-center space-y-3">
                <h2
                    className="text-3xl font-bold bg-clip-text text-transparent"
                    style={{
                        backgroundImage: `linear-gradient(90deg, ${secondary}, ${primary})`,
                    }}
                >
                    {brand.name}
                </h2>

                <div className="flex justify-center space-x-2 pt-2">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: secondary }}></div>
                    <div className="w-3 h-3 rounded-full animate-pulse animation-delay-200" style={{ backgroundColor: primary }}></div>
                    <div className="w-3 h-3 rounded-full animate-pulse animation-delay-400" style={{ backgroundColor: secondary }}></div>
                </div>
            </div>

        </div>
    );
}
