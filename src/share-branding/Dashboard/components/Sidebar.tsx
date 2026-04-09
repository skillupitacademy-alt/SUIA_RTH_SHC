'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  Network,
  Award,
  Settings,
} from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';

interface NavItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileQuestion, label: 'Exam Engine', href: '/launch-exam' },
  { icon: BookOpen, label: 'Tutorial Engine', href: '/tutorial' },
  { icon: Network, label: 'Node Map', href: '/node-map' },
  { icon: Award, label: 'Certificates', href: '/certificates' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const brand = useBrand();
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close dashboard navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-20 flex-col items-center border-r border-gray-200 bg-white py-8 md:flex">
        <div
          className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl text-white shadow-md"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name === 'RealTutorialHub' ? 'RTH' : 'SU'}
        </div>

        <nav className="flex flex-1 flex-col gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive ? 'shadow-md' : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: brand.primaryColor } : undefined}
              >
                <Icon className={isActive ? 'text-white' : 'text-gray-600'} size={22} />
              </Link>
            );
          })}
        </nav>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-gray-200 bg-white p-5 shadow-2xl transition-transform duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div
          className="mb-8 inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl px-4 font-black text-base text-white shadow-md"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name === 'RealTutorialHub' ? 'RTH' : 'SU'}
        </div>

        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={onClose}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: brand.primaryColor } : undefined}
              >
                <Icon className={isActive ? 'text-white' : 'text-gray-600'} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
