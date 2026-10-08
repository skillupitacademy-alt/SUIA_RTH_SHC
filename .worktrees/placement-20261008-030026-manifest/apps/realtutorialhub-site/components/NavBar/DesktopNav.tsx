"use client";

import React from "react";
import { NavItem } from "@/lib/NavBarData";

interface DesktopNavProps {
  navItems: NavItem[];
  activeSection: string;
  onNavItemClick: (id: string) => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({
  navItems,
  activeSection,
  onNavItemClick,
}) => {
  return (
    <div
      className="
        flex items-center justify-center
        bg-white/80 backdrop-blur-sm
        px-6 py-2.5
        rounded-2xl
        border border-gray-100
        shadow-sm

        lg:max-w-[820px]
        xl:max-w-none
      "
    >
      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavItemClick(item.id)}
            className={`whitespace-nowrap font-semibold transition-all duration-300 rounded-xl
              px-5 py-2.5 text-sm
              ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:text-blue-700 hover:bg-blue-50/50"
              }
            `}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesktopNav;
