import { User } from 'lucide-react';
import { BrandConfig } from '../../brandConfig';

interface HeaderStat {
  label: string;
  value: string;
}

interface HeaderProps {
  brand: BrandConfig;
  breadcrumb: string;
  desktopStats?: HeaderStat[];
  showOverview?: boolean;
}

export function Header({ brand, breadcrumb, desktopStats = [], showOverview = true }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b px-3 py-3 sm:px-4 lg:px-6 xl:h-[60px] xl:px-4 xl:py-0"
      style={{
        backgroundColor: brand.primaryColor,
        borderColor: brand.primaryColorDark,
      }}
    >
      <div className="flex min-h-[36px] items-center justify-between gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.5fr)_minmax(220px,0.9fr)] xl:gap-4">
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
            <p className="hidden truncate text-[11px] font-semibold text-white xl:block">
              {breadcrumb}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center justify-center gap-2 xl:flex">
          {showOverview &&
            desktopStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[110px] rounded-lg border border-white/70 bg-white px-3 py-2 text-center"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </div>
                <div className="mt-1 text-base font-black leading-none text-slate-900">
                  {stat.value}
                </div>
              </div>
            ))}
        </div>

        <div className="flex min-w-0 items-center justify-end">
          <div
            className="flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2"
            style={{
              borderColor: 'rgba(255,255,255,0.72)',
              backgroundColor: '#ffffff',
            }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <User className="w-5 h-5" style={{ color: brand.primaryColorDark }} />
            </div>
            <div className="min-w-0 text-right text-xs leading-tight sm:text-sm">
              <div className="font-semibold text-slate-900">John Doe</div>
              <div className="text-xs text-slate-700 max-[359px]:hidden">Student ID: 12345</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
