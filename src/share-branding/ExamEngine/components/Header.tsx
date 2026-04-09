import { BrandConfig } from '../../brandConfig';
import { User } from 'lucide-react';

interface HeaderProps {
  brand: BrandConfig;
  breadcrumb: string;
}

export function Header({ brand, breadcrumb }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b px-3 py-3 sm:px-4 lg:px-6 xl:h-[60px] xl:px-4 xl:py-0"
      style={{
        backgroundColor: brand.primaryColor,
        borderColor: brand.primaryColorDark,
      }}
    >
      <div className="flex min-h-[36px] items-center justify-between gap-3 xl:h-full">
        <div className="flex min-w-0 items-center gap-3">
        <div 
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-black"
          style={{ backgroundColor: '#ffffff', color: brand.primaryColorDark }}
        >
          {brand.name === 'RealTutorialHub' ? 'R' : 'S'}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold leading-tight text-white sm:text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {brand.name}
          </h1>
          <p className="hidden truncate text-[11px] font-medium text-white/80 xl:block">
            {breadcrumb}
          </p>
        </div>
        </div>

      <div className="flex min-w-0 items-center justify-end">
        <div
          className="flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2"
          style={{
            borderColor: 'rgba(255,255,255,0.24)',
            backgroundColor: 'rgba(255,255,255,0.14)',
          }}
        >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 text-right text-xs leading-tight sm:text-sm">
          <div className="font-semibold text-white">John Doe</div>
          <div className="text-xs text-white/80 max-[359px]:hidden">Student ID: 12345</div>
        </div>
      </div>
      </div>
      </div>
    </header>
  );
}
