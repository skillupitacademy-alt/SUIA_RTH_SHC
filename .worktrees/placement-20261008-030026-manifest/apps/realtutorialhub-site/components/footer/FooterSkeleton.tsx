

import { Skeleton } from "@/components/WhyUs/Skeleton";

const FooterSkeleton = () => {
  return (
    <footer className="border-t border-gray-200 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* -------- Top Grid -------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand + Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton height="h-6" width="w-48" />
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-5/6" />

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-3 mt-4">
              <Skeleton height="h-5" width="w-32" />
              <Skeleton height="h-4" width="w-48" />
              <Skeleton height="h-10" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <Skeleton height="h-5" width="w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="h-4" width="w-40" />
            ))}
          </div>

          {/* Popular Courses */}
          <div className="space-y-3">
            <Skeleton height="h-5" width="w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton height="h-4" width="w-32" />
                <Skeleton height="h-5" width="w-12" />
              </div>
            ))}
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* -------- Middle Grid -------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-3">
            <Skeleton height="h-5" width="w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="h-4" width="w-2/3" />
            ))}
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <Skeleton height="h-5" width="w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height="h-4" width="w-32" />
            ))}
          </div>

        </div>

        {/* -------- Bottom -------- */}
        <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row justify-between gap-4">
          <Skeleton height="h-4" width="w-48" />
          <div className="flex gap-4">
            <Skeleton height="h-4" width="w-32" />
            <Skeleton height="h-8" width="w-24" />
          </div>
        </div>

      </div>
    </footer>
  );
};

export default FooterSkeleton;
