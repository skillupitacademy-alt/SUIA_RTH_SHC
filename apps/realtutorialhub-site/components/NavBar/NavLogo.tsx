import React from "react";
import Image from "next/image";

interface NavLogoProps {
  onLogoClick: () => void;
}

const NavLogo: React.FC<NavLogoProps> = ({ onLogoClick }) => {
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
        src="/Logo.png"
        alt="Real Tutorial Hub"
        width={50}
        height={50}
        className="
    h-10 lg:h-9 xl:h-12
    w-auto
    transition-all
  "
        priority
      />

      <div className="flex flex-col">
        <span
          className="
      font-bold text-[#4B49AC] leading-tight
      text-lg
      lg:text-base
      xl:text-xl
    "
        >
          Real Tutorial Hub
        </span>
      </div>
    </div>
  );
};

export default NavLogo;
