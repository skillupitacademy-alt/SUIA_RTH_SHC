"use client";

import React from "react";
import Image from "next/image";
import { useBrand } from "@quiz/marketing-site/brand";

interface NavLogoProps {
  onLogoClick: () => void;
}

const NavLogo: React.FC<NavLogoProps> = ({ onLogoClick }) => {
  const brand = useBrand();

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={onLogoClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onLogoClick()}
      aria-label="Go to homepage"
    >
      <Image
        src={brand.logo}
        alt={brand.name}
        width={220}
        height={64}
        className="
    h-10 lg:h-9 xl:h-12
    w-auto
    transition-all
  "
        priority
      />

      {brand.showNameInHeader !== false && (
        <div className="flex flex-col">
          <span
            className="
      font-bold leading-tight
      text-lg
      lg:text-base
      xl:text-xl
    "
            style={{ color: "var(--brand-secondary)" }}
          >
            {brand.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default NavLogo;
