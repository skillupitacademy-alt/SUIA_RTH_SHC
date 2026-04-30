import { User } from 'lucide-react';
import { BrandConfig } from '../../brandConfig';
import { CardThemeMode } from './cardThemes';
import { ExamStudentIdentity } from './examSession';

interface HeaderStat {
  label: string;
  value: string;
}

interface HeaderProps {
  brand: BrandConfig;
  breadcrumb: string;
  desktopStats?: HeaderStat[];
  showOverview?: boolean;
  themeMode: CardThemeMode;
  student: ExamStudentIdentity;
}

export function Header({ brand, breadcrumb, desktopStats = [], showOverview = true, themeMode, student }: HeaderProps) {
  const chromeStyles = {
    'premium-white': {
      headerBackground: brand.primaryColor,
      borderColor: brand.primaryColorDark,
      statBg: '#FFFFFF',
      statBorder: 'rgba(255,255,255,0.78)',
      statLabel: '#64748B',
      statValue: '#0F172A',
      userBg: '#FFFFFF',
      userBorder: 'rgba(255,255,255,0.72)',
      userText: '#0F172A',
      userSubtext: '#475569',
      userAvatarBg: '#F1F5F9',
      headerText: '#FFFFFF',
      breadcrumbText: 'rgba(255,255,255,0.92)',
    },
    'soft-sage': {
      headerBackground: brand.primaryColor,
      borderColor: brand.primaryColorDark,
      statBg: '#EEF3F1',
      statBorder: 'rgba(207,221,215,0.95)',
      statLabel: '#5B6E67',
      statValue: '#203530',
      userBg: '#EEF3F1',
      userBorder: 'rgba(207,221,215,0.95)',
      userText: '#203530',
      userSubtext: '#52665E',
      userAvatarBg: '#E6EFEB',
      headerText: '#FFFFFF',
      breadcrumbText: 'rgba(255,255,255,0.9)',
    },
    'warm-sage': {
      headerBackground: brand.primaryColorDark,
      borderColor: brand.primaryColorDark,
      statBg: '#F3EFE7',
      statBorder: 'rgba(214,200,181,0.95)',
      statLabel: '#6B5B4D',
      statValue: '#3F3328',
      userBg: '#F3EFE7',
      userBorder: 'rgba(214,200,181,0.95)',
      userText: '#3F3328',
      userSubtext: '#6B5B4D',
      userAvatarBg: '#E8E0D4',
      headerText: '#FFFFFF',
      breadcrumbText: 'rgba(255,255,255,0.9)',
    },
    'high-clarity': {
      headerBackground: brand.secondaryColor,
      borderColor: '#0F172A',
      statBg: '#FFFFFF',
      statBorder: '#CBD5E1',
      statLabel: '#334155',
      statValue: '#111827',
      userBg: '#FFFFFF',
      userBorder: '#CBD5E1',
      userText: '#111827',
      userSubtext: '#334155',
      userAvatarBg: '#F1F5F9',
      headerText: '#FFFFFF',
      breadcrumbText: 'rgba(255,255,255,0.94)',
    },
  }[themeMode];

  return (
    <header
      className="sticky top-0 z-50 border-b px-3 py-3 sm:px-4 lg:px-6 xl:h-[60px] xl:px-4 xl:py-0"
      style={{
        background: chromeStyles.headerBackground,
        borderColor: chromeStyles.borderColor,
      }}
    >
      <div className="flex min-h-[36px] items-center justify-between gap-2 sm:gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.5fr)_minmax(220px,0.9fr)] xl:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base font-black sm:text-lg"
            style={{ backgroundColor: chromeStyles.userBg, color: brand.primaryColorDark }}
          >
            {brand.brandMark}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[13px] font-extrabold leading-tight xs:text-[15px] sm:text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: chromeStyles.headerText }}>
              {brand.name}
            </h1>
            <p className="hidden truncate text-[11px] font-semibold xl:block" style={{ color: chromeStyles.breadcrumbText }}>
              {breadcrumb}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 grid-cols-4 items-center justify-center gap-2 xl:grid">
          {showOverview &&
            desktopStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 rounded-lg border px-2 py-2 text-center"
                style={{ borderColor: chromeStyles.statBorder, backgroundColor: chromeStyles.statBg }}
              >
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.08em] 2xl:tracking-[0.14em]" style={{ color: chromeStyles.statLabel }}>
                  {stat.label}
                </div>
                <div className="mt-1 truncate text-base font-black leading-none" style={{ color: chromeStyles.statValue }}>
                  {stat.value}
                </div>
              </div>
            ))}
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <div
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5 max-[359px]:px-1.5 sm:max-w-none sm:gap-3 sm:px-3 sm:py-2"
            style={{
              borderColor: chromeStyles.userBorder,
              backgroundColor: chromeStyles.userBg,
            }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full max-[359px]:h-7 max-[359px]:w-7" style={{ backgroundColor: chromeStyles.userAvatarBg }}>
              <User className="w-5 h-5" style={{ color: brand.primaryColorDark }} />
            </div>
            <div className="min-w-0 text-right text-[11px] leading-tight max-[359px]:hidden sm:text-sm">
              <div className="truncate font-semibold" style={{ color: chromeStyles.userText }}>{student.name}</div>
              <div className="hidden text-xs min-[360px]:block" style={{ color: chromeStyles.userSubtext }}>
                {student.identifierLabel}: {student.identifierValue}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
