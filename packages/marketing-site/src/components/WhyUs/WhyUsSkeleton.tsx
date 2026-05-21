
import React from "react";
import { Skeleton } from "./Skeleton";

const WhyUsSkeleton: React.FC = () => {
  return (
    <section className="py-20 font-montserrat">
      <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-8 xl:px-12">

        {/* ---------- Header Skeleton ---------- */}
        <div className="text-center mb-16 max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <Skeleton height="h-10" width="w-2/3" className="mx-auto" />

          {/* Underline */}
          <Skeleton
            height="h-2"
            width="w-32"
            radius="rounded-full"
            className="mx-auto"
          />

          {/* Description */}
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />
        </div>

        {/* ---------- Cards Grid Skeleton ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border-2 p-8 min-h-[280px] flex flex-col border border-gray-200"
            >
              {/* Icon */}
              <Skeleton
                width="w-14"
                height="h-14"
                radius="rounded-xl"
              />

              {/* Content */}
              <div className="mt-6 space-y-4 flex-1">
                {/* Heading */}
                <Skeleton height="h-6" width="w-3/4" />

                {/* Heading underline */}
                <Skeleton
                  height="h-2"
                  width="w-24"
                  radius="rounded-full"
                />

                {/* Paragraph */}
                <Skeleton height="h-4" width="w-full" />
                <Skeleton height="h-4" width="w-5/6" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyUsSkeleton;
