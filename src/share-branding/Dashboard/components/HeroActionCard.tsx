import Link from 'next/link';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

export function HeroActionCard() {
  const brand = useBrand();
  const { hero } = useDashboardData();

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] p-8 shadow-lg"
      style={{ backgroundColor: brand.primaryColor }}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-white" size={20} />
          <span className="text-sm font-semibold uppercase tracking-wider text-white">{hero.badge}</span>
        </div>

        <h2 className="mb-2 text-3xl font-black text-white sm:text-4xl">{hero.title}</h2>
        <p className="mb-6 text-lg text-white">{hero.description}</p>

        <Link href={hero.ctaLabel === 'Open My Learning Path' ? '/learning-path' : '/launch-exam'}>
          <button className="group flex h-14 items-center gap-3 rounded-2xl bg-white px-8 text-lg font-bold shadow-md transition-all hover:bg-gray-50">
            <span style={{ color: brand.primaryColor }}>{hero.ctaLabel}</span>
            <ArrowRight
              className="transition-transform group-hover:translate-x-1"
              style={{ color: brand.primaryColor }}
              size={22}
            />
          </button>
        </Link>
      </div>
    </div>
  );
}
