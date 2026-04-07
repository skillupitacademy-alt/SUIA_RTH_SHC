'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  Network,
  Award,
  Settings,
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
  { icon: FileQuestion,    label: 'Exam Engine',     href: '/launch-exam' },
  { icon: BookOpen,        label: 'Tutorial Engine', href: '/tutorial' },
  { icon: Network,         label: 'Node Map',        href: '/node-map' },
  { icon: Award,           label: 'Certificates',    href: '/certificates' },
  { icon: Settings,        label: 'Settings',        href: '/settings' },
];

export function Sidebar() {
  const brand = useBrand();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 flex flex-col items-center py-8 z-50">
      {/* Logo */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-12 font-black text-white text-xl shadow-md"
        style={{ backgroundColor: brand.primaryColor }}
      >
        {brand.name === 'RealTutorialHub' ? 'RTH' : 'SU'}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              style={isActive ? { backgroundColor: brand.primaryColor } : undefined}
            >
              <Icon
                className={isActive ? 'text-white' : 'text-gray-600'}
                size={22}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}